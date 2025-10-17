import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// New dependency for Vertex AI
import { VertexAI } from "npm:@google-cloud/vertexai";

const PROJECT_ID = "auraa-ai-96399413-e4e2f";
const LOCATION = "us-central1";

const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = "gemini-1.5-flash-001";

const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 1,
    topP: 0.95,
  },
});

serve(async (req) => {
  const { prompt, history, employeeType, employeeName, businessContext } =
    await req.json();

  const chat = generativeModel.startChat({
    history: history || [],
  });

  const result = await chat.sendMessage(prompt);
  const response = result.response;

  return new Response(JSON.stringify({ response: response.candidates[0].content.parts[0].text }), {
    headers: { "Content-Type": "application/json" },
  });
});
