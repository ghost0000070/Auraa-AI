import { https } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, DocumentReference } from 'firebase-admin/firestore';
import { VertexAI } from '@google-cloud/vertexai';
import { stripe } from './utils/stripe';

import * as functions from 'firebase-functions'; // Import for Firestore triggers
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'; // Firestore operations

// Genkit imports
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { onCallGenkit, hasClaim } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { z } from 'zod';

// Define the API key secret
const googleAIapiKey = defineSecret("GOOGLE_API_KEY");
const adminEmail = defineSecret("ADMIN_EMAIL");
const adminTempPassword = defineSecret("ADMIN_TEMP_PASSWORD");


// Configure Genkit
genkit({
  plugins: [
    googleAI({
      apiKey: googleAIapiKey.value(),
    }),
  ],
  logLevel: 'debug',
  flowStateStore: 'firebase', // Using firebase for flow state storage
  flowStateRetentionInDays: 7,
});


initializeApp();
const db = getFirestore();
const auth = getAuth();

// Define your Genkit flow
const helloFlow = genkit.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string().describe('The name to greet'),
    outputSchema: z.object({ message: z.string() }),
  },
  async (name) => {
    // make a generation request
    const { text } = await genkit.ai.generate({
        model: gemini15Flash,
        prompt: `Hello Gemini, my name is ${name}`,
    });
    console.log(text);
    return { message: text };
  },
);

// Wrap the flow in onCallGenkit for deployment
export const helloGenkitFlow = onCallGenkit(
  {
    secrets: [googleAIapiKey],
    authPolicy: hasClaim('email_verified'), // Example policy: user must have a verified email
    enforceAppCheck: true, // Enforce App Check
    consumeAppCheckToken: true,
  },
  helloFlow
);


export const generateChatCompletion = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request: https.CallableRequest<{ prompt: string; history: unknown[]; model: string; }>) => {
  const { prompt, history, model: requestedModel } = request.data;

  // This function currently uses gemini-1.5-flash-001 by default
  // Client-side Gemini-Pro is handled in src/components/ChatInterface.tsx
  // If we want to support other Gemini models via backend for different AI employees,
  // we would add logic here to map `requestedModel` to a specific Vertex AI model string.
  const geminiModelToUse = 'gemini-1.5-flash-001';

  const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: geminiModelToUse,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 1,
      topP: 0.95,
    },
  });

  const chat = generativeModel.startChat({
    history: history || [],
  });

  const result = await chat.sendMessage(prompt);
  const response = result.response;

  if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new https.HttpsError('internal', 'Failed to generate a valid response from the AI model.');
  }

  return { response: response.candidates[0].content.parts[0].text };
});

export const customerPortal = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request: https.CallableRequest<{ user_id: string }>) => {
  const { user_id } = request.data;

  if (!user_id) {
    throw new https.HttpsError('invalid-argument', 'The function must be called with a user_id.');
  }

  const customerRef = db.collection('stripe_customers').doc(user_id);
  let customerDoc = await customerRef.get();

  if (!customerDoc.exists) {
    const stripeCustomer = await stripe.customers.create({
      metadata: { user_id },
    });

    await customerRef.set({ stripe_customer_id: stripeCustomer.id });

    // Also add a basic user role
    await db.collection('user_roles').doc(user_id).set({ role: 'user' }); // Fixed: Use user.id here

    customerDoc = await customerRef.get();
  }

  const customer = customerDoc.data()!;

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: 'https://auraa-ai-96399413-e4e2f.web.app/dashboard',
  });

  return { url };
});


export const deployAiEmployee = functions.runWith({ enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async (request: https.CallableRequest<{ deploymentRequestId: string }>) => {
  const { deploymentRequestId } = request.data;

  if (!deploymentRequestId) {
    throw new https.HttpsError('invalid-argument', 'The function must be called with a deploymentRequestId.');
  }

  // Fetch deployment request from Firestore
  const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
  const deploymentRequestDoc = await deploymentRequestRef.get();

  if (!deploymentRequestDoc.exists) {
    throw new https.HttpsError('not-found', 'Deployment request not found in Firestore.');
  }

  const deploymentRequest = deploymentRequestDoc.data()!;

  if (deploymentRequest.status !== 'pending') {
    throw new https.HttpsError('failed-precondition', `Deployment request has already been processed. Status: ${deploymentRequest.status}`);
  }

  // Fetch AI helper template from Firestore using the template ID stored in the deployment request
  // Assuming 'ai_helper_template_id' is a string ID within the deploymentRequest document
  const templateId = deploymentRequest.ai_helper_template_id;
  if (!templateId) {
    throw new https.HttpsError('failed-precondition', 'AI helper template ID is missing in the deployment request.');
  }

  const templateRef = db.collection('ai_helper_templates').doc(templateId);
  const templateDoc = await templateRef.get();

  if (!templateDoc.exists) {
    await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to fetch AI template details from Firestore (template not found).' });
    throw new https.HttpsError('not-found', 'AI template not found in Firestore.');
  }

  const template = templateDoc.data()!;

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
  } catch (error) {
    console.error('Error creating AI employee record in Firestore:', error);
    await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record in Firestore.' });
    throw new https.HttpsError('internal', 'Failed to create AI employee in Firestore.');
  }

  await deploymentRequestRef.update({ status: 'approved' });

  return { success: true, message: 'AI Employee deployed successfully.' };
});

export const fixAdminAccount = functions.runWith({ secrets: [adminEmail, adminTempPassword], enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async () => {
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
  } catch (error: unknown) {
    if (error instanceof Error && (error as unknown as {code: string}).code === 'auth/user-not-found') {
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
    } else if (error instanceof Error) {
        throw new https.HttpsError('internal', error.message);
    } else {
        throw new https.HttpsError('internal', 'An unknown error occurred.');
    }
  }
});

export const resetAdminPassword = functions.runWith({ secrets: [adminEmail], enforceAppCheck: true, consumeAppCheckToken: true }).https.onCall(async () => {
  const adminEmailValue = adminEmail.value();

  try {
    const link = await auth.generatePasswordResetLink(adminEmailValue);
    // You would typically send this link to the user via email.\n


    // For this migration, we'll just return it.\n


    return {
      success: true,
      message: 'Password reset link generated successfully',
      email: adminEmailValue,
      resetLink: link,
      note: 'This link should be sent to the user to reset their password.'
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
        throw new https.HttpsError('internal', error.message);
    }
    throw new https.HttpsError('internal', 'An unknown error occurred.');
  }
});

// New Firebase Function to process AI Team Communications
export const processAiTeamCommunication = functions.firestore
  .document('ai_team_communications/{communicationId}')
  .onCreate(async (snapshot, context) => {
    const communication = snapshot.data();
    const communicationId = snapshot.id;

    console.log(`💬 New AI team communication received: ${communicationId}`);

    // Only process if it's a message from a user to an AI employee
    if (communication.sender_employee !== 'User' || !communication.recipient_employee) {
      console.log('Skipping communication: Not from a user to a specific AI employee.');
      return null;
    }

    const recipientEmployeeName = communication.recipient_employee;
    const userId = communication.user_id;

    try {
      // 1. Fetch the AI employee template for the recipient
      const aiHelperTemplatesRef = collection(db, 'ai_helper_templates');
      const q = query(aiHelperTemplatesRef, where('name', '==', recipientEmployeeName));
      const templateSnapshot = await getDocs(q);

      if (templateSnapshot.empty) {
        console.warn(`No AI helper template found for recipient: ${recipientEmployeeName}`);
        // Optionally, send a default "I don't understand" message
        await addDoc(collection(db, 'ai_team_communications'), {
          sender_employee: 'System',
          recipient_employee: recipientEmployeeName,
          message_type: 'alert',
          subject: 'Communication Error',
          content: `AI Employee "${recipientEmployeeName}" not found or configured.`,
          user_id: userId,
          is_read: false,
          created_at: serverTimestamp(),
          original_communication_id: communicationId,
        });
        return null;
      }

      const aiTemplate = templateSnapshot.docs[0].data();

      // 2. Determine the Gemini model to use
      const geminiModelToUse = 'gemini-1.5-flash-001'; // Default for backend

      // Optionally, use a more capable model if specified in the template
      // For simplicity, we'll stick to gemini-1.5-flash-001 for now,
      // as "Gemini-Pro" is handled client-side.
      // If aiTemplate.model were 'GPT-4', you could map it to a stronger Gemini model here if desired.

      const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
      const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: geminiModelToUse,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7, // Adjust temperature for more creative/less factual responses
          topP: 0.95,
        },
      });

      // 3. Craft the prompt for Gemini
      // Include historical context if available in the 'metadata' of the communication
      const chatHistory = (communication.metadata?.history || []).map((msg: { sender: string; content: string; }) => ({
        role: msg.sender === 'User' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Add the AI employee's persona and skills to the prompt
      const personaPrompt = `You are ${aiTemplate.name}, a ${aiTemplate.category} expert. Your core skills include: ${aiTemplate.capabilities.join(', ')}. Your description is: "${aiTemplate.description}". Respond to the user's message concisely and helpfully, leveraging your expertise.`;
      
      const parts = [{ text: `${personaPrompt}\n\nUser: ${communication.content}` }];

      const chat = generativeModel.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage({ parts });
      const aiResponseContent = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponseContent) {
        throw new Error('Failed to generate a valid response from the AI model.');
      }

      // 4. Store AI's response in Firestore
      await addDoc(collection(db, 'ai_team_communications'), {
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
        is_read: false, // AI's response is initially unread by the user
        created_at: serverTimestamp(),
      });

      console.log(`✅ AI employee "${aiTemplate.name}" responded to communication ${communicationId}`);
      return null;

    } catch (error) {
      console.error(`❌ Error processing AI team communication ${communicationId}:`, error);
      // Log an error message in communications if AI fails to respond
      await addDoc(collection(db, 'ai_team_communications'), {
        sender_employee: 'System',
        recipient_employee: recipientEmployeeName,
        message_type: 'alert',
        subject: 'AI Response Error',
        content: `AI Employee "${recipientEmployeeName}" encountered an error while responding. Please check logs.`,
        user_id: userId,
        is_read: false,
        created_at: serverTimestamp(),
        original_communication_id: communicationId,
      });
      return null;
    }
  });
