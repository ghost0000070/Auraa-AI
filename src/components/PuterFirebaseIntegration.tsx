import React, { useState } from 'react';
import { db } from '../firebase'; // Import your initialized Firestore instance
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Firestore functions
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { toast } from "@/components/ui/use-toast";
import { Clipboard, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const PuterFirebaseIntegration: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateScript = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedScript('');
    
    try {
      // 1. Store the user's request in Firestore
      const docRef = await addDoc(collection(db, "puter-script-requests"), {
        prompt: inputText,
        status: "pending",
        createdAt: Timestamp.now(),
      });
      
      // 2. (Next Step) - A backend process (e.g., Firebase Function) would listen 
      //    to this collection, generate the script, and update the document.
      // 3. For now, we'll simulate this with a placeholder script.
      const placeholderScript = `
        # Your generated Puter script will appear here.
        # This is a placeholder. In a real application, a backend process
        # would generate this script based on your prompt: "${inputText}"
        
        # Example:
        # p.echo("Hello from a generated script!");
      `.trim();
      
      setGeneratedScript(placeholderScript);
      
      toast({
        title: 'Script Request Submitted',
        description: 'Your request has been sent. The script will be generated shortly.',
      });

    } catch (err) {
      console.error("Error submitting script request: ", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to submit your script request. Please try again.',
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
      <p className="mb-4 text-sm text-gray-600">
        Describe the task you want to automate, and we'll generate a Puter script for you.
      </p>
      
      <div className="grid w-full gap-2">
        <Label htmlFor="prompt">Task Description</Label>
        <Textarea
          id="prompt"
          placeholder="e.g., 'Open notepad and type Hello World'"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
        />
        <Button onClick={handleGenerateScript} disabled={isLoading || !inputText.trim()}>
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
          <div className="relative p-4 bg-gray-900 text-white rounded-md font-mono text-sm">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={copyToClipboard}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <pre><code>{generatedScript}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuterFirebaseIntegration;
