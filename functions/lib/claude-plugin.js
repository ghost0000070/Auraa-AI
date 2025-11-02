"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeModel = void 0;
const core_1 = require("@genkit-ai/core");
const Anthropic = __importStar(require("@anthropic-ai/sdk"));
const secret_manager_1 = require("@google-cloud/secret-manager");
const secretManagerClient = new secret_manager_1.SecretManagerServiceClient();
async function getApiKey() {
    const [version] = await secretManagerClient.accessSecretVersion({
        name: 'projects/auraa-ai-5508554al(c11d3/secrets/ANTHROPIC_API_KEY/versions/latest',
    });
    const payload = version.payload?.data?.toString();
    if (!payload) {
        throw new Error('Missing ANTHROPIC_API_KEY in Secret Manager');
    }
    return payload;
}
// Map Genkit's content parts to Anthropic's format.
function toAnthropicMessages(messages) {
    const anMessages = [];
    for (const message of messages) {
        if (message.role === 'system') {
            // System messages are handled separately in Anthropic's API
            continue;
        }
        const anMessage = {
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content.map((part) => {
                if (part.text) {
                    return { type: 'text', text: part.text };
                }
                throw new core_1.GenkitError({
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
async function claudeGenerate(request) {
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
    }
    catch (e) {
        throw new core_1.GenkitError({
            status: 'INTERNAL',
            message: `[Claude API] ${e.message}`,
        });
    }
}
// Define the custom model plugin.
exports.claudeModel = (0, core_1.defineModel)({
    name: 'anthropic/claude',
    label: 'Anthropic Claude',
    version: '3.0',
    supports: {
        generate: true,
        systemRole: true,
    },
}, async (request) => {
    return claudeGenerate(request);
});
//# sourceMappingURL=claude-plugin.js.map