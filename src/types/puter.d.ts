export interface PuterChatResponse {
    message: {
        content: Array<{
            text: string;
        }>;
    };
}

export interface PuterAI {
    chat(prompt: string, options?: { model?: string; stream?: boolean }): Promise<PuterChatResponse | AsyncIterable<unknown>>;
}

export interface Puter {
    ai: PuterAI;
    print: (text: string) => void;
}

declare global {
    interface Window {
        puter: Puter;
    }
    const puter: Puter;
}