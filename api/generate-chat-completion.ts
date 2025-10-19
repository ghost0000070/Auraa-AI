import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    return response.status(200).json({ completion: completion.choices[0] });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
