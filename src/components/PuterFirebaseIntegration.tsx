import React, { useState } from 'react';
import { db } from '../firebase'; // Import your initialized Firestore instance
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Firestore functions
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { toast } from 'sonner';
import { Clipboard, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

function PuterFirebaseIntegration() {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateAndSave = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedText('');

    try {
      // Placeholder for Puter.js text generation
      // In a real scenario, you'd call the Puter API here.
      const simulatedGeneratedText = `This is a generated response for the prompt: "${prompt}"`;
      setGeneratedText(simulatedGeneratedText);

      // Save the generated text to Firestore
      await addDoc(collection(db, "generated_content"), {
        prompt: prompt,
        generatedText: simulatedGeneratedText,
        createdAt: Timestamp.now(),
      });

      toast("Success!", {
        description: "Text generated and saved to Firestore.",
      });

    } catch (e) {
      console.error("Error generating text or saving to Firestore: ", e);
      setError('An error occurred. Please try again.');
      toast("Error", {
        description: "Could not generate or save the text.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!generatedText) return;

    navigator.clipboard.writeText(generatedText)
      .then(() => {
        toast('Copied!', { description: 'The generated text has been copied to your clipboard.' });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast('Error', { description: 'Failed to copy text to the clipboard.' });
      });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Puter Firebase Tool</h3>
      <div className="grid w-full gap-1.5">
        <Label htmlFor="prompt">Enter your prompt</Label>
        <Textarea 
          placeholder="Type your prompt here to generate and save text." 
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <Button onClick={handleGenerateAndSave} disabled={loading} className="mt-2">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? 'Generating...' : 'Generate & Save'}
      </Button>

      <div className="mt-4">
        <Label htmlFor="generated-text">Generated Text</Label>
        <div className="relative">
          <Textarea
            id="generated-text"
            value={generatedText}
            readOnly
            placeholder="Generated text will appear here..."
            className="min-h-[150px] bg-muted pr-10"
          />
          {generatedText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={handleCopyToClipboard}
            >
              <Clipboard className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PuterFirebaseIntegration;