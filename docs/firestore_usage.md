# Firestore Usage Guide

This document provides a comprehensive guide to how this project uses Google Firestore for data storage and management. It covers the main data models, common operations, and security rules.

## Data Models

Our Firestore database is organized into several key collections:

- **\`users\`**: Stores user-specific information, including authentication details and links to other data, like their Stripe customer ID.
  - *Fields*: \`uid\`, \`email\`, \`stripe_customer_id\`, etc.

- **\`aiEmployees\`**: Contains the records of all deployed AI employees. Each document represents a unique, active AI agent.
  - *Fields*: \`user_id\`, \`name\`, \`deployment_config\`, \`status\`, \`created_at\`.

- **\`deploymentRequests\`**: Tracks requests to deploy new AI employees. This collection serves as a log and a queue for the deployment process.
  - *Fields*: \`user_id\`, \`template_id\`, \`status\` ('pending', 'approved', 'failed'), \`created_at\`.

- **\`ai_employee_templates\`**: Stores the templates for the different types of AI employees that can be deployed.
  - *Fields*: \`id\`, \`name\`, \`department\`, \`description\`, \`cost\`.

## Common Operations

The codebase demonstrates several common Firestore operations, primarily performed in the serverless functions located in the \`api/\` directory.

### 1. Creating Documents

New documents are added to a collection using the \`add()\` method, which automatically generates a unique document ID.

**Example: Creating a new AI Employee**
When a deployment is approved, a new document is created in the \`aiEmployees\` collection.

\`\`\`typescript
// From: api/deploy-ai-employee.ts
await db.collection('aiEmployees').add({
  user_id: deploymentRequest.user_id,
  deployment_request_id: deploymentRequestRef.id,
  name: template.name || 'AI Employee',
  status: 'active',
  created_at: new Date().toISOString(),
});
\`\`\`

### 2. Updating Documents

The \`update()\` method is used to modify specific fields on an existing document without overwriting the entire document.

**Example: Updating a Deployment Request Status**
After an AI employee is successfully created, the original request's status is updated to 'approved'.

\`\`\`typescript
// From: api/deploy-ai-employee.ts
await deploymentRequestRef.update({ status: 'approved' });
\`\`\`

### 3. Setting Documents with a Specific ID

For bulk data imports or when you need a predictable document ID, the \`set()\` method is used on a document reference.

**Example: Importing AI Employee Templates**
The \`import.cjs\` script uses the \`id\` from the JSON file as the document ID in Firestore.

\`\`\`javascript
// From: import.cjs
const docId = String(item.id);
delete item.id;
await collectionRef.doc(docId).set(item);
\`\`\`

## Security Rules

Firestore security rules are defined in \`firestore.rules\` and are crucial for protecting data from unauthorized access. The rules are written to be restrictive by default, only allowing access that is explicitly defined.

A common pattern is to allow users to only read and write their own data.

**Example: Restricting Access to User Data**

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only manage their own AI employees
    match /aiEmployees/{employeeId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
  }
}
\`\`\`
*Note: The above is an example of secure rules and may not reflect the exact current contents of \`firestore.rules\`.*
