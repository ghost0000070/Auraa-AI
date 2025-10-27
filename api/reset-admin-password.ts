import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from './lib/firebase';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const adminEmail = 'ghostspooks@icloud.com';

  try {
    const link = await auth.generatePasswordResetLink(adminEmail);
    return response.status(200).json({
      success: true,
      message: 'Password reset link generated successfully',
      email: adminEmail,
      resetLink: link,
      note: 'This link should be sent to the user to reset their password.'
    });
  } catch (error) {
    console.error('💥 Function error:', error);
    return response.status(500).json({ success: false, error: (error as Error).message });
  }
}
