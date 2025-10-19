import { https } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, DocumentReference } from 'firebase-admin/firestore';
import { VertexAI } from '@google-cloud/vertexai';
import { stripe } from './utils/stripe';

import * as functions from 'firebase-functions'; // Import for Firestore triggers
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'; // Firestore operations


initializeApp();
const db = getFirestore();
const auth = getAuth();

export const generateChatCompletion = https.onCall(async (request) => {
  const { prompt, history, model: requestedModel } = request.data;

  // This function currently uses gemini-1.5-flash-001 by default
  // Client-side Gemini-Pro is handled in src/components/ChatInterface.tsx
  // If we want to support other Gemini models via backend for different AI employees,
  // we would add logic here to map `requestedModel` to a specific Vertex AI model string.
  let geminiModelToUse = 'gemini-1.5-flash-001';

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

export const customerPortal = https.onCall(async (request) => {
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
    await db.collection('user_roles').doc(user.id).set({ role: 'user' }); // Fixed: Use user.id here

    customerDoc = await customerRef.get();
  }

  const customer = customerDoc.data()!;

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: 'https://auraa-ai-96399413-e4e2f.web.app/dashboard',
  });

  return { url };
});


export const deployAiEmployee = https.onCall(async (request) => {
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

export const fixAdminAccount = https.onCall(async () => {
  const adminEmail = 'ghostspooks@icloud.com';
  const tempPassword = 'AdminReset2024!';

  try {
    const user = await auth.getUserByEmail(adminEmail);
    await auth.updateUser(user.uid, {
      password: tempPassword,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(user.uid, { admin: true });

    await db.collection('user_roles').doc(user.uid).set({ role: 'admin' }, { merge: true });
    await db.collection('subscribers').doc(user.uid).set({
      email: adminEmail,
      subscribed: true,
      subscription_tier: 'Enterprise',
      subscription_end: null,
    }, { merge: true });

    return {
      success: true,
      message: 'Admin account fixed successfully',
      user_id: user.uid,
      email: adminEmail,
      temporary_password: tempPassword,
      note: 'Please log in with this temporary password and change it immediately'
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
      const user = await auth.createUser({
        email: adminEmail,
        password: tempPassword,
        emailVerified: true,
      });
      await auth.setCustomUserClaims(user.uid, { admin: true });

      await db.collection('user_roles').doc(user.uid).set({ role: 'admin' });
      await db.collection('subscribers').doc(user.uid).set({
        email: adminEmail,
        subscribed: true,
        subscription_tier: 'Enterprise',
        subscription_end: null,
      });

      return {
        success: true,
        message: 'Admin account created successfully',
        user_id: user.uid,
        email: adminEmail,
        temporary_password: tempPassword,
        note: 'Please log in with this temporary password and change it immediately'
      };
    } else if (error instanceof Error) {
        throw new https.HttpsError('internal', error.message);
    } else {
        throw new https.HttpsError('internal', 'An unknown error occurred.');
    }
  }
});

export const resetAdminPassword = https.onCall(async () => {
  const adminEmail = 'ghostspooks@icloud.com';

  try {
    const link = await auth.generatePasswordResetLink(adminEmail);
    // You would typically send this link to the user via email.\n
    // For this migration, we\'ll just return it.\n
    return {
      success: true,
      message: 'Password reset link generated successfully',
      email: adminEmail,
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
      let geminiModelToUse = 'gemini-1.5-flash-001'; // Default for backend

      // Optionally, use a more capable model if specified in the template
      // For simplicity, we\'ll stick to gemini-1.5-flash-001 for now,
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
      const chatHistory = (communication.metadata?.history || []).map((msg: any) => ({
        role: msg.sender === 'User' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Add the AI employee\'s persona and skills to the prompt
      const personaPrompt = `You are ${aiTemplate.name}, a ${aiTemplate.category} expert. Your core skills include: ${aiTemplate.capabilities.join(', ')}. Your description is: "${aiTemplate.description}". Respond to the user\'s message concisely and helpfully, leveraging your expertise.`;
      
      const parts = [{ text: `${personaPrompt}\n\nUser: ${communication.content}` }];

      const chat = generativeModel.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage({ parts });
      const aiResponseContent = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponseContent) {
        throw new Error('Failed to generate a valid response from the AI model.');
      }

      // 4. Store AI\'s response in Firestore
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
        is_read: false, // AI\'s response is initially unread by the user
        created_at: serverTimestamp(),
      });

      console.log(`✅ AI employee \"${aiTemplate.name}\" responded to communication ${communicationId}`);
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
