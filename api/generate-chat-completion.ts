import { VertexAI } from '@google-cloud/vertexai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { prompt, history } = request.body;

  const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: 'us-central1' });
  const model = 'gemini-1.5-flash-001';

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
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
  const chatResponse = result.response;

  response.status(200).json({ response: chatResponse.candidates[0].content.parts[0].text });
}
