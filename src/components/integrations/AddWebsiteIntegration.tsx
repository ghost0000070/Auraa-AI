import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { encryptCredential } from '@/lib/crypto';
import { useAuth } from '@/hooks/useAuth';

interface Props { onCreated?: () => void }

export function AddWebsiteIntegration({ onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<'none'|'basic'|'form'>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const targetCollection = collection(db, 'integration_targets');
      const targetDoc = await addDoc(targetCollection, {
        owner_user: user.id,
        name,
        base_url: baseUrl,
        auth_type: authType,
        public_key: '' // TODO: Implement public key generation
      });

      if (authType !== 'none' && (username || password)) {
        const envelope = await encryptCredential(JSON.stringify({ username, password }));
        const credentialCollection = collection(db, 'integration_credentials');
        await addDoc(credentialCollection, {
          target_id: targetDoc.id,
          owner_user: user.id,
          credentials_encrypted: JSON.stringify(envelope)
        });
      }

      setName(''); setBaseUrl(''); setUsername(''); setPassword('');
      onCreated?.();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border rounded p-4 bg-card">
      <h3 className="font-semibold text-sm">Add Website Integration</h3>
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <div className="flex flex-col gap-1">
        <label className="text-xs">Name</label>
        <input className="input input-bordered" value={name} required onChange={e=>setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs">Base URL</label>
        <input className="input input-bordered" type="url" value={baseUrl} required onChange={e=>setBaseUrl(e.target.value)} placeholder="https://example.com/dashboard" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs">Auth Type</label>
        <select className="input input-bordered" value={authType} onChange={e=>setAuthType(e.target.value as 'none' | 'basic' | 'form')}>
          <option value="none">None</option>
          <option value="basic">Basic</option>
          <option value="form">Form</option>
        </select>
      </div>
      {authType !== 'none' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs">Username</label>
            <input className="input input-bordered" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs">Password</label>
            <input className="input input-bordered" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
        </div>
      )}
      <button disabled={saving} className="btn btn-primary w-full text-sm">
        {saving ? 'Saving...' : 'Add Integration'}
      </button>
      <p className="text-[10px] text-muted-foreground">
        Only add sites you control. Credentials currently weakly encoded; replace with strong public-key encryption.
      </p>
    </form>
  );
}
