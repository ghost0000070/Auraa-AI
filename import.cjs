const admin = require('firebase-admin');
const fs = require('fs');

// Fetch the service account key JSON file contents
// const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // databaseURL: "https://databaseName.firebaseio.com"
});

const db = admin.firestore();

async function importCollection(collectionName, jsonFilePath) {
  try {
    console.log(`Attempting to read file: ${jsonFilePath}`);
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    if (!Array.isArray(jsonData)) {
      console.error(`Error: ${jsonFilePath} does not contain a JSON array.`);
      return;
    }

    const collectionRef = db.collection(collectionName);

    for (const item of jsonData) {
      // Assuming each item in the array should become a document with a specific ID
      // and that each item has an 'id' field to use as the document ID
      if (!item.id) {
        console.warn(`Skipping item without 'id' field in ${jsonFilePath}`);
        continue;
      }

      const docId = String(item.id); // Ensure document ID is a string
      delete item.id; // Remove the id field from the document data

      await collectionRef.doc(docId).set(item);
      console.log(`Document with ID ${docId} added to ${collectionName}`);
    }

    console.log(`Successfully imported ${jsonData.length} documents to ${collectionName}`);
  } catch (error) {
    console.error(`Error importing collection ${collectionName}:`, error);
  }
}

async function main() {
  const collections = [
    { name: 'users', path: '/home/user/Auraa-AI/supabase_export/users.json' },
    { name: 'ai_employees', path: '/home/user/Auraa-AI/supabase_export/ai_employees.json' },
    { name: 'deploymentRequests', path: '/home/user/Auraa-AI/supabase_export/deployment_requests.json' },
    { name: 'subscribers', path: '/home/user/Auraa-AI/supabase_export/subscribers.json' },
    { name: 'stripeCustomers', path: '/home/user/Auraa-AI/supabase_export/stripe_customers.json' },
  ];

  for (const collection of collections) {
    await importCollection(collection.name, collection.path);
  }
}

main();