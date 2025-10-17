import React, { useState } from 'react';
import { db } from '../firebase'; // Import your initialized Firestore instance
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Firestore functions

function PuterFirebaseIntegration() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateAndSave = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // 1. Use Puter.js to generate text
      // @ts-ignore - puter is globally available after script tag
      const puterResponse = await puter.ai.chat(prompt, { model: 'claude-sonnet-4' });
      const generatedText = puterResponse.message.content[0].text;
      setResponse(generatedText);

      // 2. Save the generated text to Firestore
      const docRef = await addDoc(collection(db, 'ai_generations'), {
        prompt: prompt,
        generatedText: generatedText,
        createdAt: Timestamp.now(),
      });
      console.log('Document written with ID: ', docRef.id);

    } catch (err) {
      console.error('Error during AI generation or Firestore save:', err);
      setError('Failed to generate or save text. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Puter.js & Firebase Integration</h2>
      <p>Enter a prompt to generate text with Claude Sonnet 4 and save it to Firestore.</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., Explain quantum computing in simple terms"
        rows={5}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <button
        onClick={handleGenerateAndSave}
        disabled={loading}
        style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        {loading ? 'Generating & Saving...' : 'Generate & Save to Firestore'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {response && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <h3>Generated Text:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default PuterFirebaseIntegration;
