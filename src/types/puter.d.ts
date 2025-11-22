
interface PuterChatResponse {
    message: {
        content: Array<{
            text: string;
        }>;
    };
}

interface PuterAI {
    chat(prompt: string, options?: { model?: string; stream?: boolean }): Promise<PuterChatResponse | AsyncIterable<any>>;
}

interface Puter {
    ai: PuterAI;
    print: (text: string) => void;
}

interface Window {
    puter: Puter;
}

declare const puter: Puter;
