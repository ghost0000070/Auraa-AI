
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { templates } from "../src/lib/ai-employee-templates";
import { firebaseConfig } from "../src/firebase";

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
