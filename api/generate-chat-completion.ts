import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManagerClient = new SecretManagerServiceClient();

async function getApiKey(): Promise<string> {
  const [version] = await secretManagerClient.accessSecretVersion({
    name: 'projects/auraa-ai-55085540-c11d3/secrets/ANTHROPIC_API_KEY/versions/latest',
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error('Missing API key in Secret Manager');
  }
  return payload;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { prompt, personality } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const apiKey = await getApiKey();
    const anthropic = new Anthropic({ apiKey });

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      system: personality, // Pass the personality as a system message
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });

    return response.status(200).json({ completion: completion.content[0] });
  } catch (error) {
    return response.status(500).json({ error: (error as Error).message });
  }
}
