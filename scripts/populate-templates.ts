
import 'dotenv/config';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { templates } from "../src/lib/ai-employee-templates";

// Initialize Firebase Admin
// We try to use application default credentials.
try {
    initializeApp({
        credential: applicationDefault(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
} catch (e) {
    console.error("Error initializing admin app:", e);
    process.exit(1);
}

const db = getFirestore();

async function populateTemplates() {
  const collectionName = "ai_employee_templates";
  const templatesCollection = db.collection(collectionName);

  console.log(`Checking existing templates in ${collectionName}...`);
  try {
      const snapshot = await templatesCollection.get();
      if (!snapshot.empty) {
          console.log(`Collection ${collectionName} already has ${snapshot.size} documents. Skipping population to avoid duplicates.`);
          return;
      }
  } catch (e) {
      console.error("Error checking collection:", e);
      return;
  }

  console.log(`Populating ${collectionName}...`);

  for (const template of templates) {
    try {
      // Remove Icon component before saving
      const { Icon, ...templateData } = template;
      
      await templatesCollection.add(templateData);
      console.log(`Added "${template.name}" to the database.`);
    } catch (error) {
      console.error(`Error adding "${template.name}":`, error);
    }
  }
  console.log("Population complete.");
}

populateTemplates().catch(console.error);
