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
  res.json({ status: "ok", geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
