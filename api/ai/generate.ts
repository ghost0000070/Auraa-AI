import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// Model selection based on task complexity/category
const MODEL_MAP: Record<string, string> = {
  // Complex tasks - use Opus
  'strategy': 'claude-opus-4-20250514',
  'analytics': 'claude-opus-4-20250514',
  'executive': 'claude-opus-4-20250514',
  'business-intelligence': 'claude-opus-4-20250514',
  
  // Standard tasks - use Sonnet
  'sales': 'claude-sonnet-4-20250514',
  'engineering': 'claude-sonnet-4-20250514',
  'marketing': 'claude-sonnet-4-20250514',
  'content': 'claude-sonnet-4-20250514',
  'default': 'claude-sonnet-4-20250514',
  
  // Fast tasks - use Haiku
  'support': 'claude-3-5-haiku-latest',
  'operations': 'claude-3-5-haiku-latest',
  'quick': 'claude-3-5-haiku-latest',
};

function getModelForCategory(category?: string): string {
  if (!category) return MODEL_MAP['default'];
  const normalizedCategory = category.toLowerCase().trim();
  return MODEL_MAP[normalizedCategory] || MODEL_MAP['default'];
}

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { prompt, systemPrompt, category, maxTokens = 4096 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = getModelForCategory(category);

    const { text, usage, finishReason } = await generateText({
      model: anthropic(model),
      prompt,
      system: systemPrompt,
      maxTokens,
    });

    return new Response(
      JSON.stringify({
        text,
        model,
        usage: {
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          totalTokens: usage?.totalTokens,
        },
        finishReason,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Vercel AI Gateway error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('rate') || errorMessage.includes('429');
    
    return new Response(
      JSON.stringify({
        error: 'AI generation failed',
        details: errorMessage,
        retryable: isRateLimit,
      }),
      {
        status: isRateLimit ? 429 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
