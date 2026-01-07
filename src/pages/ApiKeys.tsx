import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Key, Copy, Trash2, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
  scopes: string[];
}

const ApiKeys: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, last_used_at, created_at, is_active, scopes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'auraa_';
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createApiKey = async () => {
    if (!user || !newKeyName.trim()) return;

    setCreating(true);
    try {
      const fullKey = generateApiKey();
      const keyPrefix = fullKey.substring(0, 12) + '...';

      // Hash the key for storage (in production, use proper hashing)
      const keyHash = btoa(fullKey);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes: ['read', 'write'],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      setNewKeyValue(fullKey);
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setApiKeys(prev => prev.map(k => (k.id === id ? { ...k, is_active: isActive } : k)));
      toast.success(isActive ? 'API key enabled' : 'API key disabled');
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setNewKeyName('');
    setNewKeyValue(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              API Keys
            </h1>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {newKeyValue ? 'API Key Created' : 'Create New API Key'}
                </DialogTitle>
                <DialogDescription>
                  {newKeyValue
                    ? 'Copy your API key now. You won\'t be able to see it again.'
                    : 'Give your API key a name to identify it later.'}
                </DialogDescription>
              </DialogHeader>

              {newKeyValue ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-300 mb-2">
                      ⚠️ Make sure to copy your API key now. You won't be able to see it again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-slate-950 rounded text-xs text-green-400 break-all">
                        {newKeyValue}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKeyValue)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleDialogClose}>Done</Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g. Production API Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button onClick={createApiKey} disabled={!newKeyName.trim() || creating}>
                      {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Create Key
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="bg-slate-800/50 border-slate-700/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Use API keys to access Auraa AI programmatically. Keep your keys secure and never share them publicly.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage your API keys for external integrations</CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No API keys yet</p>
                <p className="text-sm mt-1">Create your first API key to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{key.name}</span>
                          <Badge
                            variant="outline"
                            className={
                              key.is_active
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }
                          >
                            {key.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <code className="text-xs">{key.key_prefix}</code>
                          <span>
                            Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                          </span>
                          {key.last_used_at && (
                            <span>
                              Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={key.is_active}
                          onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteApiKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ApiKeys;
