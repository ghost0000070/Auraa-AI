import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { recaptchaToken } = request.body;

    if (!recaptchaToken) {
      return response.status(400).json({ success: false, error: 'No reCAPTCHA token provided' });
    }

    const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

    if (!SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY environment variable not set.');
      return response.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams();
    params.append('secret', SECRET_KEY);
    params.append('response', recaptchaToken);

    const recaptchaResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await recaptchaResponse.json();

    if (data.success) {
      console.log('reCAPTCHA verification successful:', data);
      return response.status(200).json({ success: true });
    } else {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return response.status(400).json({ success: false, error: data['error-codes'] || 'reCAPTCHA verification failed' });
    }
  } catch (error: any) {
    console.error('Error in reCAPTCHA function:', error.message);
    return response.status(500).json({ success: false, error: 'Internal server error' });
  }
}
