import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import SubscriptionGuard from "@/components/SubscriptionGuard"; // Corrected import
import { Header } from "@/components/Header";
import { Json } from '@/integrations/supabase/types';

interface PowerUp {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  details: Json;
}

const PowerUps = () => {
  const [powerUps, setPowerUps] = useState<PowerUp[]>(
    [
      { id: "1", name: "AI-Driven Anomaly Detection", description: "Automatically detect anomalies in your data patterns.", status: "inactive", details: {} },
      { id: "2", name: "Automated Report Generation", description: "Generate comprehensive reports automatically.", status: "inactive", details: {} },
      { id: "3", name: "Predictive Analytics Module", description: "Forecast future trends and outcomes with high accuracy.", status: "inactive", details: {} },
    ]
  );

  useEffect(() => {
    // In a real application, fetch user-specific power-up statuses from Supabase
    const fetchPowerUpStatus = async () => {
      // This is a placeholder for actual data fetching from Supabase
      // const { data, error } = await supabase.from('user_power_ups').select('*').eq('user_id', user.id);
      // if (data) { setPowerUps(data); }
      // if (error) { console.error("Error fetching power-ups:", error); }
    };
    fetchPowerUpStatus();
  }, []);

  const togglePowerUpStatus = (id: string) => {
    setPowerUps(powerUps.map(pu =>
      pu.id === id ? { ...pu, status: pu.status === 'active' ? 'inactive' : 'active' } : pu
    ));
    toast({
      title: "Power-up Toggled",
      description: "Power-up status has been updated.",
    });
  };

  return (
    <SubscriptionGuard requiredTier="Premium">
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Power-Ups</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {powerUps.map((powerUp) => (
              <Card key={powerUp.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{powerUp.name}</CardTitle>
                  {powerUp.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {powerUp.status === 'inactive' && <XCircle className="h-4 w-4 text-red-500" />}
                  {powerUp.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                </CardHeader>
                <CardContent>
                  <CardDescription>{powerUp.description}</CardDescription>
                  <div className="mt-4">
                    <button
                      onClick={() => togglePowerUpStatus(powerUp.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${powerUp.status === 'active' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                      {powerUp.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </SubscriptionGuard>
  );
};

export default PowerUps;