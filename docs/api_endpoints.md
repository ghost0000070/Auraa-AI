# API Endpoint Documentation

This document provides an overview of the key serverless API endpoints used in the Auraa AI platform. These endpoints handle backend logic for tasks like deploying AI employees, managing user accounts, and processing payments.

All API endpoints are defined in the \`api/\` directory.

---

## AI Employee Management

### \`POST /api/deploy-ai-employee\`

- **File:** \`api/deploy-ai-employee.ts\`
- **Description:** This is the core endpoint for deploying a new AI employee. It takes a deployment request, validates it, creates a new AI employee record in Firestore, and updates the original request status.
- **Security:** Requires user authentication to identify the user making the request.
- **Process:**
  1.  Retrieves the deployment request from the \`deploymentRequests\` collection in Firestore.
  2.  Checks if the request has already been processed (status is not 'pending').
  3.  Finds the corresponding AI employee template.
  4.  Creates a new document in the \`aiEmployees\` collection with the deployment details.
  5.  Updates the original deployment request's status to 'approved'.
- **Usage:** This endpoint is called from the frontend when a user confirms the deployment of a new AI employee from a template.

---

## User & Account Management

### \`POST /api/fix-admin-account\`

- **File:** \`api/fix-admin-account.ts\`
- **Description:** A utility endpoint designed to ensure that a specific user has administrative privileges. It sets a custom claim ('admin') on a user's Firebase Auth account.
- **Security:** This is a protected endpoint and should only be accessible to authorized developers or through a secure internal process. It operates on a hardcoded admin email address.
- **Process:**
  1.  Looks up the user by a predefined admin email address.
  2.  If the user exists, it sets the \`admin\` custom claim to \`true\` using \`admin.auth().setCustomUserClaims()\`.
- **Usage:** This is primarily used for initial setup or for correcting permissions if the admin account loses its privileges.

### \`POST /api/reset-admin-password\`

- **File:** \`api/reset-admin-password.ts\`
- **Description:** Allows for the password of the admin account to be reset directly from the backend.
- **Security:** Highly sensitive. This endpoint operates on a hardcoded admin email and should be protected to prevent unauthorized password resets.
- **Process:**
  1.  Looks up the user by the admin email.
  2.  Generates a new, secure password.
  3.  Updates the user's password in Firebase Authentication using \`admin.auth().updateUser()\`.
- **Usage:** An administrative tool for recovering the admin account if the password is lost.

---

## External Service Integrations

### \`POST /api/customer-portal\`

- **File:** \`api/customer-portal.ts\`
- **Description:** Creates a new Stripe Billing Portal session for a user, allowing them to manage their subscription and payment methods.
- **Security:** Requires user authentication. It retrieves the user's Stripe customer ID from Firestore.
- **Process:**
  1.  Authenticates the user via Firebase.
  2.  Looks up the user's document in the \`users\` collection to find their Stripe customer ID.
  3.  Calls the Stripe API to create a new billing portal session.
  4.  Returns the session URL to the frontend, which then redirects the user to the Stripe portal.
- **Usage:** Called when a user clicks a "Manage Subscription" or "Billing" button in the application.

### \`POST /api/verify-recaptcha\`

- **File:** \`api/verify-recaptcha.ts\`
- **Description:** Verifies a reCAPTCHA token from the client to protect against bots and abuse.
- **Process:**
  1.  Receives a reCAPTCHA token from the frontend.
  2.  Sends the token to the Google reCAPTCHA verification service.
  3.  Returns a success or failure response based on the verification result.
- **Usage:** Used on public-facing forms, like login or sign-up, to ensure that the user is a human.
