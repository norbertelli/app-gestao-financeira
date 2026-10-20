export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = req.headers['asaas-access-token'];

    if (webhookToken && receivedToken && receivedToken !== webhookToken) {
      console.warn('[ASAAS WEBHOOK] Token de autenticação inválido.');
      return res.status(401).json({ error: 'Unauthorized webhook token' });
    }

    const { event, payment } = req.body || {};
    console.log(`[ASAAS WEBHOOK] Evento recebido no Vercel: ${event}`, payment?.id);

    // Eventos de sucesso no Asaas:
    // PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_UPDATED
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      console.log(`[ASAAS WEBHOOK] Pagamento ${payment?.id} compensado com sucesso!`);
    }

    return res.json({ received: true, event, paymentId: payment?.id });
  } catch (err: any) {
    console.error('Erro no processamento do webhook Asaas:', err);
    return res.status(500).json({ error: err.message || 'Webhook error' });
  }
}
