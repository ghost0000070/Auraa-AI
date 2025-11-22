import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as serviceAccount from '../serviceAccountKey.json'; // You will need to provide this file

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

const targetEmail = 'ghostspooks@icloud.com';

async function setAdminPrivileges() {
  try {
    // 1. Find the user by email
    const userRecord = await auth.getUserByEmail(targetEmail);
    const uid = userRecord.uid;

    console.log(`Found user with UID: ${uid}`);

    // 2. Update the Firestore document
    const userRef = db.collection('users').doc(uid);
    
    // Check if document exists first to decide on set vs update
    const docSnap = await userRef.get();
    
    const adminData = {
      role: 'admin',
      is_active: true, // Bypasses subscription check
      plan: 'enterprise', // For UI display
      updatedAt: new Date()
    };

    if (docSnap.exists) {
        await userRef.update(adminData);
        console.log('Updated existing user document with admin privileges.');
    } else {
        // Create the document if it doesn't exist (unlikely for a logged-in user, but good for safety)
        await userRef.set({
            email: targetEmail,
            createdAt: new Date(),
            ...adminData
        });
        console.log('Created new user document with admin privileges.');
    }
    
    console.log('Success! User now has full site owner status.');

  } catch (error) {
    console.error('Error setting admin privileges:', error);
  }
}

setAdminPrivileges();
