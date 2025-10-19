
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from './lib/firebase';

// Helper to check for Firebase Auth error structure
interface FirebaseAuthError extends Error {
    code: string;
}

const isFirebaseAuthError = (error: unknown): error is FirebaseAuthError => {
    return typeof error === 'object' && error !== null && 'code' in error;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  const adminEmail = 'ghostspooks@icloud.com';
  const tempPassword = 'AdminReset2024!';

  try {
    try {
      // Case 1: User exists, so we'll fix their account
      const userRecord = await auth.getUserByEmail(adminEmail);
      
      await auth.updateUser(userRecord.uid, {
        password: tempPassword,
        emailVerified: true,
      });
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });

      // Ensure database records are correct
      await db.collection('user_roles').doc(userRecord.uid).set({ role: 'admin' }, { merge: true });
      await db.collection('subscribers').doc(userRecord.uid).set({
        email: adminEmail,
        subscribed: true,
        subscription_tier: 'Enterprise',
        subscription_end: null, // No expiry for admin
      }, { merge: true });
      
      return response.status(200).json({
        success: true,
        message: 'Admin account fixed successfully',
        userId: userRecord.uid,
      });

    } catch (error: unknown) {
      // Case 2: User does not exist, so we'll create them
      if (isFirebaseAuthError(error) && error.code === 'auth/user-not-found') {
        const newUserRecord = await auth.createUser({
          email: adminEmail,
          password: tempPassword,
          emailVerified: true,
        });
        await auth.setCustomUserClaims(newUserRecord.uid, { admin: true });

        // Create the necessary database records
        await db.collection('user_roles').doc(newUserRecord.uid).set({ role: 'admin' });
        await db.collection('subscribers').doc(newUserRecord.uid).set({
          email: adminEmail,
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null,
        });

        return response.status(201).json({
          success: true,
          message: 'Admin account created successfully',
          userId: newUserRecord.uid,
        });
      }
      // Re-throw any other auth-related errors to be caught below
      throw error;
    }
  } catch (error: unknown) {
    console.error('Error in fixAdminAccount function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return response.status(500).json({ success: false, error: errorMessage });
  }
}
