import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase';

const AddWebsiteIntegration = ({ userId, onIntegrationAdded }: { userId: string, onIntegrationAdded: () => void }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleAddIntegration = async () => {
    if (!websiteUrl) return;

    try {
      // Ensure fresh auth token before Firestore writes
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
      
      await addDoc(collection(db, 'websiteIntegrations'), {
        userId,
        url: websiteUrl,
        createdAt: serverTimestamp(),
      });
      setWebsiteUrl('');
      onIntegrationAdded();
    } catch (error) {
      console.error('Error adding website integration: ', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
        placeholder="https://example.com"
        className="p-2 border rounded-md w-full"
      />
      <button onClick={handleAddIntegration} className="px-4 py-2 bg-blue-500 text-white rounded-md">
        Add Website
      </button>
    </div>
  );
};

export default AddWebsiteIntegration;
