import { useState, useEffect } from 'react';

// Use global Puter loaded via CDN script tag in index.html
declare global {
  interface Window {
    puter?: {
      auth: {
        isSignedIn: () => Promise<boolean>;
        getAuthToken: () => Promise<string>;
        getUsername: () => Promise<string>;
        signIn: () => Promise<void>;
      };
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<{ message?: { content?: Array<{ text?: string }> } }>;
      };
    };
  }
}

export const usePuter = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    const initPuter = async () => {
      setIsLoading(true);
      try {
        // Check if Puter SDK is available (loaded via CDN)
        if (!window.puter) {
          setIsAvailable(false);
          setError('Puter SDK not loaded');
          setIsLoading(false);
          return;
        }

        setIsAvailable(true);
        const puter = window.puter;

        // Check if user is authenticated first
        const isAuthenticated = await puter.auth.isSignedIn();
        
        if (!isAuthenticated) {
          // User not signed in, don't try to get token
          setAuthToken(null);
          setUsername(null);
          setError(null);
          setIsLoading(false);
          return;
        }

        const token = await puter.auth.getAuthToken();
        setAuthToken(token);

        const user = await puter.auth.getUsername();
        setUsername(user);

      } catch (e) {
        console.error("Puter initialization failed:", e);
        setError("Failed to initialize Puter. Please ensure you are logged in.");
      } finally {
        setIsLoading(false);
      }
    };

    initPuter();
  }, []);

  return { username, authToken, error, isLoading, isAvailable };
};
