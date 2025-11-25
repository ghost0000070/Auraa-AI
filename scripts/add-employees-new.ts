
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { templates } from "../src/lib/ai-employee-templates";

const firebaseConfig = {
    "projectId": "auraa-ai-69",
    "appId": "1:934906097027:web:4439f08b47535bd94adab6",
    "databaseURL": "https://auraa-ai-69-default-rtdb.firebaseio.com",
    "storageBucket": "auraa-ai-69.firebasestorage.app",
    "apiKey": "AIzaSyDBuYjbkoJYVyYNpiUMBd_rQI84a0MGyKo",
    "authDomain": "auraa-ai-69.firebaseapp.com",
    "messagingSenderId": "934906097027",
    "measurementId": "G-V2XPRFME79",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addEmployees() {
  const employeesCollection = collection(db, "ai_employees");

  for (const template of templates) {
    try {
      await addDoc(employeesCollection, {
        name: template.name,
        description: template.description,
        category: template.category,
        exampleTasks: template.exampleTasks,
        backendTask: template.backendTask,
      });
      console.log(`Added "${template.name}" to the database.`);
    } catch (error) {
      console.error(`Error adding "${template.name}":`, error);
    }
  }
}

addEmployees();
