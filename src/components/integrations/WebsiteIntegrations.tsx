import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

interface Integration {
  id: string;
  url: string;
  createdAt: string;
  lastScrapedAt?: string;
  status?: string;
}

export const WebsiteIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('website_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setIntegrations(data.map((i: any) => ({
          id: i.id,
          url: i.url,
          createdAt: i.created_at,
          lastScrapedAt: i.last_scraped_at,
          status: i.status
        })));
      }
    } catch (error) {
      console.error('Error fetching website integrations: ', error);
      toast.error("Failed to fetch website integrations.");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleScrape = async (integrationId: string, url: string) => {
    setScraping(integrationId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call Supabase Edge Function for website scraping
      const { data, error: fnError } = await supabase.functions.invoke('scrape-website', {
        body: {
          integrationId,
          url,
          userId: user.id,
        }
      });
      
      if (fnError) throw fnError;
      
      toast.success(data?.message || "Website scraped successfully.");
      
      // Refetch integrations to show updated data
      setTimeout(fetchIntegrations, 2000);
    } catch (error) {
      console.error('Error initiating scrape: ', error);
      toast.error(error instanceof Error ? error.message : "Failed to scrape website.");
    }
    setScraping(null);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <div key={integration.id} className="p-4 border rounded-md flex justify-between items-center">
          <div>
            <p className="font-semibold">{integration.url}</p>
            <p className="text-sm text-muted-foreground">
              Added on: {new Date(integration.createdAt).toLocaleDateString()}
            </p>
            {integration.lastScrapedAt && (
              <p className="text-sm text-muted-foreground">
                Last Scraped: {new Date(integration.lastScrapedAt).toLocaleDateString()}
              </p>
            )}
            {integration.status && (
              <Badge>{integration.status}</Badge>
            )}
          </div>
          <Button 
            onClick={() => handleScrape(integration.id, integration.url)} 
            disabled={scraping === integration.id}
          >
            {scraping === integration.id ? <Loader2 className="animate-spin h-5 w-5" /> : 'Scrape Now'}
          </Button>
        </div>
      ))}
    </div>
  );
};
