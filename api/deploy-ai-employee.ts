
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase';
import { DocumentReference } from 'firebase-admin/firestore';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  try {
    const { deploymentRequestId } = request.body;

    if (!deploymentRequestId) {
      return response.status(400).json({ error: 'Missing deploymentRequestId in request body' });
    }

    const deploymentRequestRef = db.collection('aiEmployeeDeploymentRequests').doc(deploymentRequestId);
    const deploymentRequestDoc = await deploymentRequestRef.get();

    if (!deploymentRequestDoc.exists) {
      return response.status(404).json({ error: 'Deployment request not found.' });
    }

    const deploymentRequest = deploymentRequestDoc.data()!;

    if (deploymentRequest.status !== 'pending') {
      return response.status(409).json({ 
        error: `Deployment request has already been processed. Status: ${deploymentRequest.status}` 
      });
    }

    const templateRef = deploymentRequest.ai_helper_template;
    if (!(templateRef instanceof DocumentReference)) {
        throw new Error('Deployment request contains an invalid template reference.');
    }
    
    const templateDoc = await templateRef.get();
    if (!templateDoc.exists) {
        await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'AI helper template not found.' });
        return response.status(404).json({ error: 'AI helper template not found.' });
    }
    const template = templateDoc.data()!;

    // Create the deployed AI employee record
    await db.collection('aiEmployees').add({
      user_id: deploymentRequest.user_id,
      deployment_request_id: deploymentRequestRef.id,
      name: template.name || 'AI Employee',
      deployment_config: deploymentRequest.deployment_config,
      status: 'active',
      created_at: new Date().toISOString(),
      deployed_at: new Date().toISOString(),
    });

    // Update the original request status to 'approved'
    await deploymentRequestRef.update({ status: 'approved' });

    return response.status(200).json({ success: true, message: 'AI Employee deployed successfully.' });

  } catch (error) {
    console.error('Error deploying AI employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: `Failed to deploy AI employee: ${errorMessage}` });
  }
}
