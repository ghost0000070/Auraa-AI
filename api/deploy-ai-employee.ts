import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
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
    return response.status(412).json({ error: `Deployment request has already been processed. Status: ${deploymentRequest.status}` });
  }

  // Assuming ai_helper_template is a DocumentReference in Firestore
  const templateRef = deploymentRequest.ai_helper_template as FirebaseFirestore.DocumentReference;
  const templateDoc = await templateRef.get();
  const template = templateDoc.data()!;

  try {
    await db.collection('aiEmployees').add({
      user_id: deploymentRequest.user_id,
      deployment_request_id: deploymentRequestRef.id,
      name: template.name || 'AI Employee',
      deployment_config: deploymentRequest.deployment_config,
      status: 'active',
    });
  } catch (error: any) {
    await deploymentRequestRef.update({ status: 'rejected', rejection_reason: 'Failed to create AI employee record.' });
    return response.status(500).json({ error: 'Failed to create AI employee.', details: error.message });
  }

  await deploymentRequestRef.update({ status: 'approved' });

  return response.status(200).json({ success: true, message: 'AI Employee deployed successfully.' });
}
