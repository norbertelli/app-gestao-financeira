export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const paymentId = req.query?.paymentId || req.url?.split('/').pop();
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  // If real Asaas API Key is present in environment, query Asaas directly
  const apiKey = process.env.ASAAS_API_KEY;
  const isProd = process.env.ASAAS_ENV === 'production';
  const baseUrl = isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";

  if (apiKey && apiKey.trim().length > 15 && !paymentId.startsWith('pay_asaas_')) {
    try {
      const resp = await fetch(`${baseUrl}/payments/${paymentId}`, {
        headers: { "access_token": apiKey.trim() },
      });
      if (resp.ok) {
        const data = await resp.json();
        const isPaid = data.status === "CONFIRMED" || data.status === "RECEIVED";
        return res.json({
          isPaid,
          status: data.status,
          value: data.value,
          billingType: data.billingType,
        });
      }
    } catch (e) {
      console.warn("Could not query Asaas API status:", e);
    }
  }

  // Simulated fallback
  return res.json({
    isPaid: false,
    status: "PENDING",
  });
}
