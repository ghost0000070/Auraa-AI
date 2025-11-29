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

export interface PuterAuth {
    isSignedIn(): Promise<boolean>;
    getAuthToken(): Promise<string>;
    getUsername(): Promise<string>;
    signIn(): Promise<void>;
    signOut(): Promise<void>;
}

export interface Puter {
    ai: PuterAI;
    auth: PuterAuth;
    print: (text: string) => void;
}

declare module 'puter' {
    const puter: Puter;
    export default puter;
}

declare global {
    interface Window {
        puter: Puter;
    }
    const puter: Puter;
}
