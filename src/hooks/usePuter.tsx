import { useState, useEffect } from 'react';
import puter from 'puter';

export const usePuter = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initPuter = async () => {
      setIsLoading(true);
      try {
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

  return { username, authToken, error, isLoading };
};
