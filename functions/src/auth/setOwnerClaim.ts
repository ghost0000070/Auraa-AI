import * as admin from 'firebase-admin';
import {auth} from 'firebase-functions/v1';

const OWNER_EMAIL = 'owner@auraa-ai.com';

/**
 * Automatically set owner claim when owner@auraa-ai.com signs up or logs in
 */
export const setOwnerClaimOnCreate = auth.user().onCreate(async (user) => {
  if (user.email === OWNER_EMAIL) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, {
        owner: true,
        admin: true,
      });
      
      console.log(`✅ Owner claim set for ${OWNER_EMAIL} (${user.uid})`);
      
      // Update Firestore user document
      await admin.firestore().collection('users').doc(user.uid).set({
        role: 'owner',
        tier: 999,
        is_active: true,
      }, { merge: true });
      
    } catch (error) {
      const baseMessage = `Failed to set owner claim for ${OWNER_EMAIL} (${user.uid})`;
      if (error instanceof Error) {
        console.error(baseMessage, { name: error.name, message: error.message });
      } else {
        console.error(baseMessage, { error });
      }
      // Rethrow so this critical security operation does not fail silently
      throw error;
    }
  }
});

/**
 * Also check on every sign-in to ensure owner claim persists
 */
export const verifyOwnerClaimOnSignIn = auth.user().beforeSignIn(async (user) => {
  if (user.email === OWNER_EMAIL) {
    const existingClaims = user.customClaims || {};
    if (!existingClaims.owner) {
      await admin.auth().setCustomUserClaims(user.uid, {
        ...existingClaims,
        owner: true,
        admin: true,
      });
      console.log(`✅ Owner claim restored for ${OWNER_EMAIL}`);
    }
  }
  return user;
});
