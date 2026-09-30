export default function handler(req: any, res: any) {
  res.status(200).json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
}
