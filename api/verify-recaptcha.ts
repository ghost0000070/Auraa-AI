import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { token } = request.body;
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  try {
    const verificationResponse = await fetch(verificationUrl, { method: 'POST' });
    const data = await verificationResponse.json();

    if (data.success && data.score > 0.5) {
      return response.status(200).json({ success: true });
    } else {
      return response.status(400).json({ success: false, error: 'reCAPTCHA verification failed' });
    }
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
