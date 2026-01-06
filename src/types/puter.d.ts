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

// Remove the broken npm module declaration
// Puter.js is loaded via CDN script tag in index.html

declare global {
    interface Window {
        puter: Puter;
    }
    // Global puter variable available from CDN script
    const puter: Puter;
}
