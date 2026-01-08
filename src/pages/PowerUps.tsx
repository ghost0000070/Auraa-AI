import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { supabase } from "@/supabase";
import { useAuth } from '@/hooks/useAuth';
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PowerUp {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  details: Record<string, unknown>;
}

interface UserPowerUp {
  id: string;
  user_id: string;
  powerup_id: string;
  is_active: boolean;
  activated_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const PowerUps = () => {
  const { user } = useAuth();
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
      { id: "1", name: "AI-Driven Anomaly Detection", description: "Automatically detect anomalies in your data patterns.", status: "inactive", details: {} },
      { id: "2", name: "Automated Report Generation", description: "Generate comprehensive reports automatically.", status: "inactive", details: {} },
      { id: "3", name: "Predictive Analytics Module", description: "Forecast future trends and outcomes with high accuracy.", status: "inactive", details: {} },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPowerUpStatus = async () => {
        try {
            const { data: userPowerUps, error } = await supabase
              .from('user_powerups')
              .select('*')
              .eq('user_id', user.id);
            
            if (userPowerUps && !error) {
                setPowerUps(currentPowerUps =>
                    currentPowerUps.map(p => {
                        const found = userPowerUps.find((up: UserPowerUp) => up.powerup_id === p.id);
                        return found ? { ...p, status: found.is_active ? 'active' : 'inactive' } : p;
                    })
                );
            }
        } catch (error) {
            console.error("Error fetching powerups:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchPowerUpStatus();
  }, [user]);

  const togglePowerUpStatus = async (id: string) => {
    if (!user) return;

    const powerUp = powerUps.find(p => p.id === id);
    if (!powerUp) return;

    const newStatus = powerUp.status === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setPowerUps(powerUps.map(pu => (pu.id === id ? { ...pu, status: newStatus } : pu)));

    try {
        const { error } = await supabase
          .from('user_powerups')
          .upsert({ 
            user_id: user.id,
            powerup_id: id, 
            is_active: newStatus === 'active',
            activated_at: newStatus === 'active' ? new Date().toISOString() : null,
          }, {
            onConflict: 'user_id,powerup_id'
          });
        
        if (error) throw error;
        
        toast.success(`Power-up ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`, {
            description: `${powerUp.name} is now ${newStatus}.`,
        });
    } catch (error) {
        console.error("Error toggling power-up:", error);
        // Revert on error
        setPowerUps(powerUps.map(pu => (pu.id === id ? { ...pu, status: powerUp.status } : pu)));
        toast.error("Failed to update status", {
            description: "Please try again later."
        });
    }
  };

  return (
    <SubscriptionGuard requiredTier="Premium">
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6 pt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold">Power-Ups</h1>
                <p className="text-muted-foreground">Supercharge your AI workforce with advanced modules</p>
            </div>
          </div>
          
          {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                  ))}
              </div>
          ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {powerUps.map((powerUp) => (
                  <Card key={powerUp.id} className="border-muted/50 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold leading-tight">{powerUp.name}</CardTitle>
                          {powerUp.status === 'active' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                          {powerUp.status === 'inactive' && <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />}
                          {powerUp.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500 shrink-0" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-6 min-h-[40px]">{powerUp.description}</CardDescription>
                      <Button
                        onClick={() => togglePowerUpStatus(powerUp.id)}
                        variant={powerUp.status === 'active' ? "destructive" : "default"}
                        className="w-full"
                      >
                        {powerUp.status === 'active' ? 'Deactivate Module' : 'Activate Module'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
          )}
        </main>
      </div>
    </SubscriptionGuard>
  );
};

export default PowerUps;
