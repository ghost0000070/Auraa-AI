import { useEffect, useState, useCallback } from 'react';
import { db, functions } from '@/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface Integration {
  id: string;
  url: string;
  createdAt: Timestamp;
  lastScrapedAt?: Timestamp;
  status?: string;
}

export const FirebaseWebsiteIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'websiteIntegrations'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const integrationsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integration));
      setIntegrations(integrationsData);
    } catch (error) {
      console.error('Error fetching website integrations: ', error);
      toast({
        title: "Error",
        description: "Failed to fetch website integrations.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleScrape = async (integrationId: string, url: string) => {
    setScraping(integrationId);
    try {
      const scrapeWebsite = httpsCallable(functions, 'scrapeWebsite');
      await scrapeWebsite({ url });
      toast({
        title: "Scraping Initiated",
        description: "The website is being scraped. This may take a few minutes.",
      });
      // Optionally, you can refetch integrations after a delay
      setTimeout(fetchIntegrations, 5000);
    } catch (error) {
      console.error('Error initiating scrape: ', error);
      toast({
        title: "Error",
        description: "Failed to initiate scraping.",
        variant: "destructive",
      });
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
            <p className="text-sm text-gray-500">
              Added on: {integration.createdAt?.toDate().toLocaleDateString()}
            </p>
            {integration.lastScrapedAt && (
              <p className="text-sm text-gray-500">
                Last Scraped: {integration.lastScrapedAt.toDate().toLocaleDateString()}
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
