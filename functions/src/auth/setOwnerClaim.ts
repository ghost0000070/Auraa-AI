import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const OWNER_EMAIL = 'owner@auraa-ai.com';

/**
 * Automatically set owner claim when the owner account is created
 * This function runs on user creation and checks if the email matches the owner email
 */
export async function setOwnerClaimOnCreate(user: admin.auth.UserRecord): Promise<void> {
  const email = user.email;
  
  if (!email) {
    logger.info(`User ${user.uid} has no email, skipping owner claim check`);
    return;
  }

  // Check if this is the owner account
  if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    try {
      // Set custom claims for the owner
      await admin.auth().setCustomUserClaims(user.uid, {
        owner: true,
        admin: true,
      });
      
      logger.info(`Owner claims set successfully for ${email} (${user.uid})`);
      
      // Also create/update the user document in Firestore with owner status
      const db = admin.firestore();
      await db.collection('users').doc(user.uid).set({
        email: email,
        isOwner: true,
        tier: 'owner',
        is_active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      logger.info(`Owner user document created/updated for ${email}`);
    } catch (error) {
      logger.error(`Error setting owner claims for ${email}:`, error);
      throw error;
    }
  } else {
    logger.info(`User ${email} is not the owner account, skipping owner claim`);
  }
}
