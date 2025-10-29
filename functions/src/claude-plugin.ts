import { GenkitError, Message, Model, defineModel } from 'genkit';
import { GenerateRequest, Part } from 'genkit/generate';
import *-as Anthropic from '@anthropic-ai/sdk';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManagerClient = new SecretManagerServiceClient();

async function getApiKey(): Promise<string> {
  const [version] = await secretManagerClient.accessSecretVersion({
    name: 'projects/auraa-ai-55085540-c11d3/secrets/ANTHROPIC_API_KEY/versions/latest',
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error('Missing ANTHROPIC_API_KEY in Secret Manager');
  }
  return payload;
}

// Map Genkit's content parts to Anthropic's format.
function toAnthropicMessages(messages: Message[]): Anthropic.Messages.MessageParam[] {
  const anMessages: Anthropic.Messages.MessageParam[] = [];
  for (const message of messages) {
    if (message.role === 'system') {
      // System messages are handled separately in Anthropic's API
      continue;
    }
    const anMessage: Anthropic.Messages.MessageParam = {
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content.map((part) => {
        if (part.text) {
          return { type: 'text', text: part.text };
        }
        // Note: This example only handles text parts. You would add logic
        // here to handle other types like images if needed.
        throw new GenkitError({
          status: 'INVALID_ARGUMENT',
          message: 'Unsupported message part type.',
        });
      }),
    };
    anMessages.push(anMessage);
  }
  return anMessages;
}

// The core generation logic for the custom model.
async function claudeGenerate(request: GenerateRequest) {
  const apiKey = await getApiKey();
  const anthropic = new Anthropic({ apiKey });

  const modelName = request.config?.model || 'claude-3-sonnet-20240229';
  const systemMessage = request.messages.find(m => m.role === 'system');
  const userMessages = toAnthropicMessages(request.messages);

  try {
    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: request.config?.maxOutputTokens || 2048,
      temperature: request.config?.temperature,
      top_p: request.config?.topP,
      system: systemMessage?.content[0].text,
      messages: userMessages,
    });

    return {
      candidates: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'model',
            content: [{ text: response.content[0].text }],
          },
        },
      ],
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      }
    };
  } catch (e: any) {
    throw new GenkitError({
      status: 'INTERNAL',
      message: `[Claude API] ${e.message}`,
    });
  }
}

// Define the custom model plugin.
export const claudeModel: Model = defineModel(
  {
    name: 'anthropic/claude',
    label: 'Anthropic Claude',
    version: '3.0',
    supports: {
      generate: true,
      systemRole: true,
    },
  },
  claudeGenerate
);
