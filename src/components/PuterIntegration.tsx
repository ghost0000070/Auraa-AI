import React, { useState } from 'react';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "@/components/ui/toast-hooks";
import { Clipboard, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { usePuter } from '@/hooks/usePuter'; // Import the new hook

const PuterIntegration: React.FC = () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call Supabase Edge Function for script generation
      const { data, error: fnError } = await supabase.functions.invoke('generate-puter-script', {
        body: {
          prompt: inputText,
          userId: user.id,
          puterUsername: puterUsername,
        }
      });
      
      if (fnError) throw fnError;
      
      if (data?.script) {
        setGeneratedScript(data.script);
        toast({
          title: 'Script Generated',
          description: 'Your Puter script has been generated successfully!',
        });
      }

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

      {puterIsLoading && <p className="mb-2 text-sm text-muted-foreground">Connecting to Puter...</p>}
      {puterError && <p className="mb-2 text-sm text-destructive">{puterError}</p>}
      {puterUsername && <p className="mb-2 text-sm text-green-500">Connected to Puter as: <strong>{puterUsername}</strong></p>}

      <p className="my-4 text-sm text-muted-foreground">
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
        <div className="mt-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {generatedScript && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Generated Script:</h3>
          <div className="relative p-4 bg-secondary text-foreground rounded-md font-mono text-sm overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
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

export default PuterIntegration;
