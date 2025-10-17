const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log("Supabase URL:", process.env.SUPABASE_URL);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Key must be set as environment variables.');
  process.exit(1);
}

// Reverted to default schema settings
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpTableToJson(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      throw error;
    }

    // Create directory if it doesn’t exist
    const dir = `./supabase_export`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filename = `${dir}/${tableName}.json`;

    // If data is null or empty, create an empty JSON file
    if (!data || data.length === 0) {
      console.warn(`No data found in table: ${tableName}. Creating empty file.`);
      fs.writeFileSync(filename, JSON.stringify([], null, 2));
      return;
    }

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${tableName} to ${filename}`);
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
  }
}

async function main() {
  const tables = [
    'subscribers',
    'user_roles',
    'business_profiles',
    'ai_employee_deployment_requests',
    'ai_helper_templates'
  ];

  for (const table of tables) {
    await dumpTableToJson(table);
  }
}

main();