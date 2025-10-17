import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from './lib/firebase';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const adminEmail = 'ghostspooks@icloud.com';
  const tempPassword = 'AdminReset2024!';

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      await auth.updateUser(userRecord.uid, {
        password: tempPassword,
        emailVerified: true,
      });
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });

      await db.collection('user_roles').doc(userRecord.uid).set({ role: 'admin' }, { merge: true });
      await db.collection('subscribers').doc(userRecord.uid).set({
        email: adminEmail,
        subscribed: true,
        subscription_tier: 'Enterprise',
        subscription_end: null,
      }, { merge: true });

      return response.status(200).json({
        success: true,
        message: 'Admin account fixed successfully',
        user_id: userRecord.uid,
        email: adminEmail,
        temporary_password: tempPassword,
        note: 'Please log in with this temporary password and change it immediately'
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: adminEmail,
          password: tempPassword,
          emailVerified: true,
        });
        await auth.setCustomUserClaims(userRecord.uid, { admin: true });

        await db.collection('user_roles').doc(userRecord.uid).set({ role: 'admin' });
        await db.collection('subscribers').doc(userRecord.uid).set({
          email: adminEmail,
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null,
        });

        return response.status(200).json({
          success: true,
          message: 'Admin account created successfully',
          user_id: userRecord.uid,
          email: adminEmail,
          temporary_password: tempPassword,
          note: 'Please log in with this temporary password and change it immediately'
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('💥 Function error:', error);
    return response.status(500).json({ success: false, error: error.message });
  }
}
