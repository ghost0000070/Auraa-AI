import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CONFIGURATION ---
// IMPORTANT: Replace with your actual Supabase credentials.
// Find these in your Supabase project settings > API.
const SUPABASE_URL = 'https://dcjwgbsqauixzmewffvh.supabase.co'; // e.g., 'https://your-project-ref.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjandnYnNxYXVpeHptZXdmZnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1MTc1OCwiZXhwIjoyMDY4NDI3NzU4fQ.4Jj8Koswru1Ie8B9FrodslQ91UGMMxZOX6lJXTrA8Ec'; // Use the 'service_role' key for this migration

// IMPORTANT: Ensure your Firebase service account key file is in the same directory.
// Download this from Firebase Console > Project settings > Service accounts.
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

// --- INITIALIZATION ---
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const firestore = admin.firestore();

// --- MIGRATION LOGIC ---

/**
 * Generic function to migrate a table from Supabase to a Firestore collection.
 * @param {string} tableName - The name of the Supabase table.
 * @param {string} collectionName - The name of the target Firestore collection.
 * @param {string|null} primaryKeyColumn - The Supabase column to use as the Firestore document ID. If null, Firestore will auto-generate IDs.
 */
async function migrateTable(tableName, collectionName, primaryKeyColumn = null) {
  console.log(`Starting migration for table: ${tableName}...`);

  // 1. Fetch all data from the Supabase table
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    console.error(`Error fetching data from Supabase table "${tableName}":`, error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`No data found in table "${tableName}". Skipping.`);
    return;
  }

  console.log(`Fetched ${data.length} records from "${tableName}".`);

  // 2. Write data to Firestore using batch writes for efficiency
  const batch = firestore.batch();
  let count = 0;

  for (const record of data) {
    let docRef;

    if (primaryKeyColumn && record[primaryKeyColumn]) {
      // Use a specific column from Supabase as the Firestore document ID
      const docId = record[primaryKeyColumn].toString();
      docRef = firestore.collection(collectionName).doc(docId);
    } else {
      // Let Firestore auto-generate the document ID
      docRef = firestore.collection(collectionName).doc();
    }
    
    // Add the record to the batch
    batch.set(docRef, record);
    count++;

    // Firestore batches have a limit of 500 operations.
    // Commit the batch every 499 records to be safe.
    if (count % 499 === 0) {
      console.log(`Committing batch of ${count} records for "${collectionName}"...`);
      await batch.commit();
      // Start a new batch for the next set of records
      batch = firestore.batch();
    }
  }

  // Commit any remaining records in the last batch
  if (count > 0) {
    console.log(`Committing final batch of records for "${collectionName}"...`);
    await batch.commit();
  }

  console.log(`✅ Successfully migrated ${count} records from "${tableName}" to Firestore collection "${collectionName}".`);
}

// --- EXECUTE MIGRATION ---
async function runMigration() {
  console.log('🚀 Starting Supabase to Firebase Migration...');
  
  // Define the migrations for each table
  await migrateTable('ai_employee_deployment_requests', 'aiEmployeeDeploymentRequests');
  await migrateTable('subscribers', 'subscribers');
  await migrateTable('ai_employees', 'aiEmployees');
  await migrateTable('business_profiles', 'businessProfiles', 'id');
  await migrateTable('stripe_customers', 'stripeCustomers', 'user_id');
  await migrateTable('user_roles', 'userRoles');
  await migrateTable('ai_helper_templates', 'aiHelperTemplates');

  console.log('🎉 Migration complete!');
}

runMigration().catch(console.error);
