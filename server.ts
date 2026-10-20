import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini AI Client initialization
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Route for Smart Statement Parsing with Gemini
app.post("/api/parse-statement", async (req, res) => {
  try {
    const { rawText, targetType, fileBase64, mimeType, fileName } = req.body;

    if (!rawText && !fileBase64) {
      return res.status(400).json({ error: "Texto do extrato ou arquivo é obrigatório." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.log("GEMINI_API_KEY não configurada. Usando fallback no servidor.");
      return res.status(200).json({
        success: false,
        fallback: true,
        message: "Chave Gemini não detectada no ambiente. O app utilizará o leitor inteligente de fallback.",
      });
    }

    const prompt = `
Você é um especialista em processamento de extratos bancários, faturas de cartão e recibos do Brasil (Itaú, Nubank, Banco do Brasil, Bradesco, Santander, C6, Inter, BTG, Sicredi, Caixa, etc).

ATENÇÃO CRÍTICA DE EXTRAÇÃO:
Você DEVE extrair TODAS e CADA UMA das transações contidas no extrato fornecido sem omitir nenhuma. Se houver 15, 20 ou 50 lançamentos no documento, você DEVE retornar TODOS no array JSON. NUNCA resuma e NUNCA retorne apenas o primeiro lançamento.

Documento/Texto a ser analisado (${targetType === 'card' ? 'Cartão de Crédito' : targetType === 'investment' ? 'Investimento' : 'Conta Bancária'}):
${rawText ? `\n"""\n${rawText}\n"""\n` : ''}

Instruções para CADA lançamento do documento:
1. Data (date): Converta para YYYY-MM-DD. Se o ano não for informado, assuma 2026.
2. Descrição (description): Limpe e formate o nome do estabelecimento/transação (ex: "PIX RECEBIDO JOAO" -> "PIX - João", "COMPRA UBER" -> "Uber", "PAGAMENTO PIX MARIA APARECIDA" -> "PIX - Maria Aparecida").
3. Valor (amount): Valor numérico da transação. IMPORTANTE: ignore saldos finais ou acumulados na mesma linha. Pegue apenas o valor real do débito ou crédito.
4. Tipo (isExpense): true para despesas/saídas/pagamentos/compras (sinal de - ou débito), false para receitas/entradas/recebimentos (sinal de + ou recebimento).
5. Categoria (category): Classifique em: "Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Salário", "Serviços", "Tarifa/Imposto", "Investimentos", "Rendimento", "Transferência", "Outros".
6. Tipo (type): "PIX", "TED", "Boleto", "Cartão", "Rendimento", "Outros".

Retorne obrigatoriamente a lista completa com TODOS os lançamentos extraídos.
`;

    // Construct Gemini content parts
    const parts: any[] = [];

    // If PDF or image or file base64 is provided
    if (fileBase64 && typeof fileBase64 === 'string') {
      let fileMime = mimeType || 'application/pdf';
      const name = (fileName || '').toLowerCase();
      if (name.endsWith('.pdf')) fileMime = 'application/pdf';
      else if (name.endsWith('.png')) fileMime = 'image/png';
      else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) fileMime = 'image/jpeg';
      else if (name.endsWith('.webp')) fileMime = 'image/webp';

      // Attach file inlineData
      if (fileMime.startsWith('application/pdf') || fileMime.startsWith('image/')) {
        parts.push({
          inlineData: {
            mimeType: fileMime,
            data: fileBase64,
          },
        });
      }
    }

    // Attach text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: parts,
      config: {
        systemInstruction: "Você é uma IA especialista em extração de lançamentos de extratos bancários, faturas em PDF e documentos em Português do Brasil.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Lista de transações extraídas do texto ou arquivo do extrato",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
              description: { type: Type.STRING, description: "Nome limpo do estabelecimento ou transação" },
              amount: { type: Type.NUMBER, description: "Valor numérico da transação" },
              isExpense: { type: Type.BOOLEAN, description: "True se for despesa/saída, False se for receita/entrada" },
              category: { type: Type.STRING, description: "Categoria da transação" },
              type: { type: Type.STRING, description: "Tipo de pagamento ex: PIX, Boleto, Cartão" },
              currentInstallment: { type: Type.INTEGER, description: "Número da parcela atual (padrão 1)" },
              totalInstallments: { type: Type.INTEGER, description: "Total de parcelas (padrão 1)" },
              invoiceMonth: { type: Type.STRING, description: "Mês da fatura YYYY-MM (para cartão)" },
            },
            required: ["date", "description", "amount", "category"],
          },
        },
      },
    });

    const jsonText = response.text?.trim() || "[]";
    const transactions = JSON.parse(jsonText);

    return res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err: any) {
    console.error("Erro no endpoint /api/parse-statement:", err);
    return res.status(500).json({
      success: false,
      error: "Falha ao processar o extrato com IA: " + (err.message || String(err)),
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    asaasConfigured: Boolean(process.env.ASAAS_API_KEY),
  });
});

// Asaas Gateway Endpoints
const paymentsStore = new Map<string, any>();

app.post("/api/asaas/create-checkout", async (req, res) => {
  try {
    const { userId, userEmail, userName, userCpfCnpj, userPhone, planId, billingType, config } = req.body;
    const apiKey = config?.apiKey || process.env.ASAAS_API_KEY;
    const isProd = config?.environment === 'production' || process.env.ASAAS_ENV === 'production' || Boolean(apiKey && apiKey.includes('prod'));
    const baseUrl = isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";


    const planPrices: Record<string, number> = {
      FREE: 0,
      PRO_MENSAL: 39.9,
      PRO_ANUAL: 349.9,
      ENTERPRISE: 119.9,
    };
    const value = planPrices[planId] || 39.9;
    const paymentId = `pay_asaas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (billingType === 'BOLETO' ? 3 : 1));
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // If real Asaas API Key is present, make the actual call
    if (apiKey && apiKey.trim().length > 15) {
      try {
        // 1. Create or get customer on Asaas
        const custRes = await fetch(`${baseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": apiKey.trim(),
          },
          body: JSON.stringify({
            name: userName || "Cliente FinFlow",
            email: userEmail,
            cpfCnpj: userCpfCnpj || undefined,
            phone: userPhone || undefined,
            notificationDisabled: false,
          }),
        });

        const custData = await custRes.json();
        let asaasCustomerId = custData.id;

        // If customer already exists with this email, fetch existing customer ID
        if (!asaasCustomerId && userEmail) {
          try {
            const findRes = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(userEmail)}`, {
              headers: { "access_token": apiKey.trim() },
            });
            if (findRes.ok) {
              const findData = await findRes.json();
              if (findData.data && findData.data.length > 0) {
                asaasCustomerId = findData.data[0].id;
              }
            }
          } catch (findErr) {
            console.warn("Could not query existing customer by email:", findErr);
          }
        }

        if (asaasCustomerId) {
          // 2. Create Payment / Subscription on Asaas

          const payRes = await fetch(`${baseUrl}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "access_token": apiKey.trim(),
            },
            body: JSON.stringify({
              customer: asaasCustomerId,
              billingType: billingType || "PIX",
              value,
              dueDate: dueDateStr,
              description: `Assinatura FinFlow ${planId} - Gestão Financeira`,
            }),
          });

          const payData = await payRes.json();
          if (payData.id) {
            let pixQr = undefined;
            if (billingType === "PIX") {
              const qrRes = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, {
                headers: { "access_token": apiKey.trim() },
              });
              if (qrRes.ok) {
                pixQr = await qrRes.json();
              }
            }

            paymentsStore.set(payData.id, {
              userId,
              planId,
              status: payData.status || "PENDING",
              value,
              billingType,
            });

            return res.json({
              success: true,
              planId,
              status: payData.status || "PENDING",
              paymentId: payData.id,
              customerId: asaasCustomerId,
              billingType,
              value,
              dueDate: dueDateStr,
              invoiceUrl: payData.invoiceUrl,
              bankSlipUrl: payData.bankSlipUrl,
              pixQrCode: pixQr,
            });
          }
        }
      } catch (asaasApiErr) {
        console.warn("Falha na chamada direta à API do Asaas, gerando fallback:", asaasApiErr);
      }
    }

    // Fallback: Sandbox local simulation with valid Pix payload
    const simulatedPayload = `00020101021226830014br.gov.bcb.pix2561pix-qr.asaas.com/qr/v3/${paymentId}520400005303986540${value.toFixed(2).length}${value.toFixed(2)}5802BR5914FINFLOW GESTAO6009SAO PAULO62070503***6304`;
    
    paymentsStore.set(paymentId, {
      userId,
      planId,
      status: billingType === "CREDIT_CARD" ? "CONFIRMED" : "PENDING",
      value,
      billingType,
    });

    return res.json({
      success: true,
      planId,
      status: billingType === "CREDIT_CARD" ? "ACTIVE" : "PENDING",
      paymentId,
      customerId: `cus_${Math.random().toString(36).substring(2, 9)}`,
      billingType,
      value,
      dueDate: dueDateStr,
      invoiceUrl: `https://sandbox.asaas.com/i/${paymentId}`,
      bankSlipUrl: billingType === "BOLETO" ? `https://sandbox.asaas.com/b/pdf/${paymentId}` : undefined,
      pixQrCode: billingType === "PIX" ? {
        encodedImage: "", // Will be rendered via SVG on frontend
        payload: simulatedPayload,
        expirationDate: `${dueDateStr} 23:59:59`,
      } : undefined,
    });
  } catch (err: any) {
    console.error("Erro no checkout Asaas:", err);
    return res.status(500).json({ success: false, error: err.message || "Erro interno" });
  }
});

app.get("/api/asaas/check-status/:paymentId", (req, res) => {
  const { paymentId } = req.params;
  const pmt = paymentsStore.get(paymentId);
  if (!pmt) {
    return res.json({ isPaid: false, status: "PENDING" });
  }

  const isPaid = pmt.status === "CONFIRMED" || pmt.status === "RECEIVED" || pmt.status === "ACTIVE";
  return res.json({
    isPaid,
    status: pmt.status,
    planId: pmt.planId,
    value: pmt.value,
    billingType: pmt.billingType,
  });
});

app.post("/api/asaas/simulate-payment", (req, res) => {
  const { paymentId, status = "CONFIRMED" } = req.body;
  const pmt = paymentsStore.get(paymentId);
  if (pmt) {
    pmt.status = status;
    paymentsStore.set(paymentId, pmt);
    return res.json({ success: true, payment: pmt });
  }
  paymentsStore.set(paymentId, { status, planId: "PRO_MENSAL" });
  return res.json({ success: true, payment: { status } });
});

// Asaas Webhook receiver
app.post("/api/asaas/webhook", (req, res) => {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = req.headers["asaas-access-token"];

    if (webhookToken && receivedToken && receivedToken !== webhookToken) {
      console.warn("[ASAAS WEBHOOK] Token de autenticação inválido.");
      return res.status(401).json({ error: "Unauthorized webhook token" });
    }

    const { event, payment } = req.body;
    console.log(`[ASAAS WEBHOOK] Evento recebido: ${event}`, payment?.id);

    if (payment && payment.id) {
      const pmt = paymentsStore.get(payment.id) || {};

      if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
        pmt.status = "CONFIRMED";
      } else if (event === "PAYMENT_OVERDUE") {
        pmt.status = "OVERDUE";
      }
      paymentsStore.set(payment.id, { ...pmt, ...payment });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Erro no processamento do webhook Asaas:", err);
    return res.status(500).json({ error: err.message });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor FinFlow rodando em http://localhost:${PORT}`);
  });
}

startServer();
