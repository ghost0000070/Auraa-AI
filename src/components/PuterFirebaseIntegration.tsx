import React, { useState } from 'react';
import { db, functions } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "@/components/ui/toast-hooks";
import { Clipboard, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { usePuter } from '@/hooks/usePuter'; // Import the new hook

const PuterFirebaseIntegration: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Use the new usePuter hook
  const { username: puterUsername, error: puterError, isLoading: puterIsLoading } = usePuter();

  const handleGenerateScript = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedScript('');
    
    try {
      // 1. Store the user's request in Firestore
      await addDoc(collection(db, "puter-script-requests"), {
        prompt: inputText,
        status: "processing",
        createdAt: Timestamp.now(),
        puterUsername, // Optionally store the Puter username
      });
      
      // 2. Call the Cloud Function
      const generateScript = httpsCallable(functions, 'generatePuterScript');
      const result = await generateScript({ 
        prompt: inputText,
        // Pass the auth token to the function if needed by the backend
        // authToken: authToken 
      });
      
      const { script } = result.data as { script: string };
      
      setGeneratedScript(script);
      
      toast({
        title: 'Script Generated',
        description: 'Your Puter script is ready.',
      });

    } catch (err) {
      console.error("Error generating script: ", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to generate script. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: 'Copied to Clipboard',
      description: 'The Puter script has been copied to your clipboard.',
    });
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Puter Script Generator</h2>

      {puterIsLoading && <p className="mb-2 text-sm text-gray-500">Connecting to Puter...</p>}
      {puterError && <p className="mb-2 text-sm text-red-600">{puterError}</p>}
      {puterUsername && <p className="mb-2 text-sm text-green-600">Connected to Puter as: <strong>{puterUsername}</strong></p>}

      <p className="my-4 text-sm text-gray-600">
        Describe the task you want to automate, and we'll generate a Puter script for you using AI.
      </p>
      
      <div className="grid w-full gap-2">
        <Label htmlFor="prompt">Task Description</Label>
        <Textarea
          id="prompt"
          placeholder="e.g., 'Open notepad and type Hello World', 'List all files in my documents folder'"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          disabled={!puterUsername} // Disable if not connected to Puter
        />
        <Button onClick={handleGenerateScript} disabled={isLoading || !inputText.trim() || !puterUsername}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Script'
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {generatedScript && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Generated Script:</h3>
          <div className="relative p-4 bg-gray-900 text-white rounded-md font-mono text-sm overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={copyToClipboard}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <pre className="whitespace-pre-wrap"><code>{generatedScript}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuterFirebaseIntegration;
