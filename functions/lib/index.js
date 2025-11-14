"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAiTeamCommunication = exports.resetAdminPassword = exports.sendWelcomeEmail = exports.setAdminPrivileges = exports.fixAdminAccount = exports.deployAiEmployee = exports.customerPortal = exports.generateChatCompletion = exports.helloFlow = void 0;
const v2_1 = require("firebase-functions/v2");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const vertexai_1 = require("@google-cloud/vertexai");
const stripe_1 = require("./utils/stripe");
const https_1 = require("firebase-functions/v2/https");
const v2_2 = require("firebase-functions/v2");
// Genkit imports
const core_1 = require("@genkit-ai/core");
const googleai_1 = require("@genkit-ai/googleai");
const firebase_1 = require("@genkit-ai/firebase");
const params_1 = require("firebase-functions/params");
const zod_1 = require("zod");
// Define the API key secret
const googleAIapiKey = (0, params_1.defineSecret)("GOOGLE_API_KEY");
const adminEmail = (0, params_1.defineSecret)("ADMIN_EMAIL");
const adminTempPassword = (0, params_1.defineSecret)("ADMIN_TEMP_PASSWORD");
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
// Configure Genkit
const firebaseOptions = {
    flowStateStore: {
        collection: 'genkit-flows',
        databaseId: '(default)' // specify your databaseId
    },
    traceStore: {
        collection: 'genkit-traces',
        databaseId: '(default)' // specify your databaseId
    },
    contextStore: {
        collection: 'genkit-context',
        databaseId: '(default)' // specify your databaseId
    }
};
(0, core_1.configure)({
    plugins: [
        (0, firebase_1.firebase)(firebaseOptions),
        (0, googleai_1.googleAI)({
            apiKey: googleAIapiKey.value(),
        }),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true
});
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
// Define your Genkit flow
exports.helloFlow = (0, firebase_1.onFlow)({
    name: 'helloFlow',
    inputSchema: zod_1.z.string().describe('The name to greet'),
    outputSchema: zod_1.z.object({ message: zod_1.z.string() }),
    auth: (user) => {
        if (!user.email_verified) {
            throw new https_1.HttpsError('unauthenticated', 'email not verified');
        }
    }
}, async (name) => {
    // make a generation request
    const result = await core.generate({
        model: googleai_1.gemini15Flash,
        prompt: `Hello Gemini, my name is ${name}`,
    });
    const text = result.text();
    v2_1.logger.log(text);
    return { message: text };
});
exports.generateChatCompletion = v2_1.https.onCall({ enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
    const { prompt, history } = request.data;
    // This function currently uses gemini-1.5-flash-001 by default
    // Client-side Gemini-Pro is handled in src/components/ChatInterface.tsx
    // If we want to support other Gemini models via backend for different AI employees,
    // we would add logic here to map `requestedModel` to a specific Vertex AI model string.
    const geminiModelToUse = 'gemini-1.5-flash-001';
    const vertex_ai = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
    const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: geminiModelToUse,
        generation_config: {
            maxOutputTokens: 2048,
            temperature: 1,
            topP: 0.95,
        },
    });
    const chat = generativeModel.startChat({
        history: history,
    });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new https_1.HttpsError('internal', 'Failed to generate a valid response from the AI model.');
    }
    return { response: response.candidates[0].content.parts[0].text };
});
exports.customerPortal = v2_1.https.onCall({ secrets: [STRIPE_SECRET_KEY], enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
    const { user_id } = request.data;
    if (!user_id) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a user_id.');
    }
    const customerRef = db.collection('stripe_customers').doc(user_id);
    let customerDoc = await customerRef.get();
    if (!customerDoc.exists) {
        const stripeCustomer = await stripe_1.stripe.customers.create({
            metadata: { user_id },
        });
        await customerRef.set({ stripe_customer_id: stripeCustomer.id });
        // Also add a basic user role
        await db.collection('user_roles').doc(user_id).set({ role: 'user' });
        customerDoc = await customerRef.get();
    }
    const customer = customerDoc.data();
    const { url } = await stripe_1.stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: 'https://auraa-ai-96399413-e4e2f.web.app/dashboard',
    });
    return { url };
});
exports.deployAiEmployee = v2_1.https.onCall({ enforceAppCheck: true, consumeAppCheckToken: true }, async (request) => {
    const { deploymentRequestId } = request.data;
    if (!deploymentRequestId) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a deploymentRequestId.');
    }
    // Fetch deployment request from Firestore
    const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
    const deploymentRequestDoc = await deploymentRequestRef.get();
    if (!deploymentRequestDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Deployment request not found in Firestore.');
    }
    const deploymentRequest = deploymentRequestDoc.data();
    if (deploymentRequest.status !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', `Deployment request has already been processed. Status: ${deploymentRequest.status}`);
    }
    // Fetch AI helper template from Firestore using the template ID stored in the deployment request
    // Assuming 'ai_helper_template_id' is a string ID within the deploymentRequest document
    const templateId = deploymentRequest.ai_helper_template_id;
    if (!templateId) {
        throw new https_1.HttpsError('failed-precondition', 'AI helper template ID is missing in the deployment request.');
    }
    const templateRef = db.collection('ai_helper_templates').doc(templateId);
    const templateDoc = await templateRef.get();
    if (!templateDoc.exists) {
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to fetch AI template details from Firestore (template not found).' });
        throw new https_1.HttpsError('not-found', 'AI template not found in Firestore.');
    }
    const template = templateDoc.data();
    try {
        // Add the deployed AI employee instance to the 'aiEmployees' collection
        await db.collection('aiEmployees').add({
            user_id: deploymentRequest.user_id,
            deployment_request_id: deploymentRequestDoc.id,
            name: template.name || 'AI Employee',
            deployment_config: deploymentRequest.deployment_config,
            status: 'active',
            template_id: templateDoc.id,
            category: template.category,
            model: template.model,
            skills: template.skills, // Assuming 'skills' field exists in ai_helper_templates
            // Include any other relevant fields from the template or deployment request
        });
    }
    catch (error) {
        v2_1.logger.error('Error creating AI employee record in Firestore:', error);
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record in Firestore.' });
        throw new https_1.HttpsError('internal', 'Failed to create AI employee in Firestore.');
    }
    await deploymentRequestRef.update({ status: 'approved' });
    return { success: true, message: 'AI Employee deployed successfully.' };
});
exports.fixAdminAccount = v2_1.https.onCall({ secrets: [adminEmail, adminTempPassword], enforceAppCheck: true, consumeAppCheckToken: true }, async () => {
    const adminEmailValue = adminEmail.value();
    const tempPasswordValue = adminTempPassword.value();
    try {
        const user = await auth.getUserByEmail(adminEmailValue);
        await auth.updateUser(user.uid, {
            password: tempPasswordValue,
            emailVerified: true,
        });
        await auth.setCustomUserClaims(user.uid, { admin: true });
        await db.collection('user_roles').doc(user.uid).set({ role: 'admin' }, { merge: true });
        await db.collection('subscribers').doc(user.uid).set({
            email: adminEmailValue,
            subscribed: true,
            subscription_tier: 'Enterprise',
            subscription_end: null,
        }, { merge: true });
        return {
            success: true,
            message: 'Admin account fixed successfully',
            user_id: user.uid,
            email: adminEmailValue,
            temporary_password: tempPasswordValue,
            note: 'Please log in with this temporary password and change it immediately'
        };
    }
    catch (error) {
        if (error instanceof Error && error.code === 'auth/user-not-found') {
            const user = await auth.createUser({
                email: adminEmailValue,
                password: tempPasswordValue,
                emailVerified: true,
            });
            await auth.setCustomUserClaims(user.uid, { admin: true });
            await db.collection('user_roles').doc(user.uid).set({ role: 'admin' });
            await db.collection('subscribers').doc(user.uid).set({
                email: adminEmailValue,
                subscribed: true,
                subscription_tier: 'Enterprise',
                subscription_end: null,
            });
            return {
                success: true,
                message: 'Admin account created successfully',
                user_id: user.uid,
                email: adminEmailValue,
                temporary_password: tempPasswordValue,
                note: 'Please log in with this temporary password and change it immediately'
            };
        }
        else if (error instanceof Error) {
            throw new https_1.HttpsError('internal', error.message);
        }
        throw new https_1.HttpsError('internal', 'An unknown error occurred.');
    }
});
exports.setAdminPrivileges = v2_1.https.onCall(async (request) => {
    const { uid, email } = request.data;
    if (email !== 'ghostspooks@icloud.com') {
        throw new v2_1.https.HttpsError('permission-denied', 'You are not authorized to perform this action.');
    }
    try {
        await auth.setCustomUserClaims(uid, { admin: true });
        await db.collection('user_roles').doc(uid).set({ role: 'admin' });
        await db.collection('subscribers').doc(uid).set({
            email: email,
            subscribed: true,
            subscription_tier: 'Enterprise',
            subscription_end: null,
        });
        return { success: true, message: 'Admin privileges granted.' };
    }
    catch (error) {
        console.error('Error setting admin privileges:', error);
        throw new v2_1.https.HttpsError('internal', 'An error occurred while setting admin privileges.');
    }
});
exports.sendWelcomeEmail = v2_1.https.onCall(async (request) => {
    const { email, displayName } = request.data;
    // This is a placeholder for sending a welcome email.
    // In a real application, you would use a service like SendGrid or Mailgun to send emails.
    console.log(`Sending welcome email to ${email} (Display Name: ${displayName}).`);
    return { success: true, message: 'Welcome email sent (simulated).' };
});
exports.resetAdminPassword = v2_1.https.onCall({ secrets: [adminEmail], enforceAppCheck: true, consumeAppCheckToken: true }, async () => {
    const adminEmailValue = adminEmail.value();
    try {
        const link = await auth.generatePasswordResetLink(adminEmailValue);
        // You would typically send this link to the user via email.
        // For this migration, we'll just return it.
        return {
            success: true,
            message: 'Password reset link generated successfully',
            email: adminEmailValue,
            resetLink: link,
            note: 'This link should be sent to the user to reset their password.'
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new https_1.HttpsError('internal', error.message);
        }
        throw new https_1.HttpsError('internal', 'An unknown error occurred.');
    }
});
// New Firebase Function to process AI Team Communications
exports.processAiTeamCommunication = v2_2.firestore.onDocumentWritten('ai_team_communications/{communicationId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        v2_1.logger.log('No data associated with the event');
        return;
    }
    const communication = snapshot.after.data();
    const communicationId = snapshot.after.id;
    if (!communication) {
        v2_1.logger.log('No data associated with the event');
        return;
    }
    v2_1.logger.log(`💬 New AI team communication received: ${communicationId}`);
    // Only process if it's a message from a user to an AI employee
    if (communication.sender_employee !== 'User' || !communication.recipient_employee) {
        v2_1.logger.log('Skipping communication: Not from a user to a specific AI employee.');
        return;
    }
    const recipientEmployeeName = communication.recipient_employee;
    const userId = communication.user_id;
    try {
        // 1. Fetch the AI employee template for the recipient
        const aiHelperTemplatesRef = db.collection('ai_helper_templates');
        const q = aiHelperTemplatesRef.where('name', '==', recipientEmployeeName);
        const templateSnapshot = await q.get();
        if (templateSnapshot.empty) {
            v2_1.logger.warn(`No AI helper template found for recipient: ${recipientEmployeeName}`);
            // Optionally, send a default "I don't understand" message
            await db.collection('ai_team_communications').add({
                sender_employee: 'System',
                recipient_employee: recipientEmployeeName,
                message_type: 'alert',
                subject: 'Communication Error',
                content: `AI Employee "${recipientEmployeeName}" not found or configured.`,
                user_id: userId,
                is_read: false,
                created_at: firestore_1.FieldValue.serverTimestamp(),
                original_communication_id: communicationId,
            });
            return;
        }
        const aiTemplate = templateSnapshot.docs[0].data();
        // 2. Determine the Gemini model to use
        const geminiModelToUse = 'gemini-1.5-flash-001'; // Default for backend
        // Optionally, use a more capable model if specified in the template
        // For simplicity, we'll stick to gemini-1.5-flash-001 for now,
        // as "Gemini-Pro" is handled client-side.
        // If aiTemplate.model were 'GPT-4', you could map it to a stronger Gemini model here if desired.
        const vertex_ai = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: geminiModelToUse,
            generation_config: {
                maxOutputTokens: 2048,
                temperature: 0.7, // Adjust temperature for more creative/less factual responses
                topP: 0.95,
            },
        });
        // 3. Craft the prompt for Gemini
        // Include historical context if available in the 'metadata' of the communication
        const firestoreHistory = communication.metadata?.history || [];
        const chatHistory = firestoreHistory.map((msg) => ({
            role: msg.sender === 'User' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));
        // Add the AI employee's persona and skills to the prompt
        const skills = Array.isArray(aiTemplate.skills) ? aiTemplate.skills.join(', ') : 'a wide range of tasks';
        const personaPrompt = `You are ${aiTemplate.name}, a ${aiTemplate.category} expert. Your core skills include: ${skills}. Your description is: "${aiTemplate.description}". Respond to the user's message concisely and helpfully, leveraging your expertise.`;
        const parts = [{ text: `${personaPrompt}\n\nUser: ${communication.content}` }];
        const chat = generativeModel.startChat({
            history: chatHistory,
        });
        const result = await chat.sendMessage(parts);
        const aiResponseContent = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponseContent) {
            throw new Error('Failed to generate a valid response from the AI model.');
        }
        // 4. Store AI's response in Firestore
        await db.collection('ai_team_communications').add({
            sender_employee: aiTemplate.name,
            recipient_employee: 'User', // AI responds to the user
            message_type: 'response',
            subject: `Re: ${communication.subject || 'Team Communication'} `,
            content: aiResponseContent,
            metadata: {
                original_communication_id: communicationId,
                ai_model_used: geminiModelToUse,
            },
            user_id: userId,
            is_read: false,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
        v2_1.logger.log(`✅ AI employee "${aiTemplate.name}" responded to communication ${communicationId}`);
        return;
    }
    catch (error) {
        v2_1.logger.error(`❌ Error processing AI team communication ${communicationId}:`, error);
        // Log an error message in communications if AI fails to respond
        await db.collection('ai_team_communications').add({
            sender_employee: 'System',
            recipient_employee: recipientEmployeeName,
            message_type: 'alert',
            subject: 'AI Response Error',
            content: `AI Employee "${recipientEmployeeName}" encountered an error while responding. Please check logs.`,
            user_id: userId,
            is_read: false,
            created_at: firestore_1.FieldValue.serverTimestamp(),
            original_communication_id: communicationId,
        });
        return;
    }
});
//# sourceMappingURL=index.js.map