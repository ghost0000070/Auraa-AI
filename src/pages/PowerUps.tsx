import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { supabase } from "@/supabase";
import { useAuth } from '@/hooks/useAuth';
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface PowerUp {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  details: Record<string, unknown>;
}

const PowerUps = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const isPremium = subscriptionStatus?.subscribed;
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
                        const found = userPowerUps.find((up: any) => up.powerup_id === p.id);
                        return found ? { ...p, status: found.status } : p;
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
            powerup_name: powerUp.name, 
            status: newStatus,
          });
        
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

        {!isPremium && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Premium Feature</h3>
                  <p className="text-muted-foreground">
                    Power-Ups are available for Premium subscribers. Upgrade to unlock advanced AI capabilities.
                  </p>
                </div>
                <Button onClick={() => navigate('/pricing')} className="ml-auto">
                  Upgrade to Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                  ))}
              </div>
          ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {powerUps.map((powerUp) => (
                  <Card key={powerUp.id} className={`border-muted/50 hover:border-primary/50 transition-colors ${!isPremium ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{powerUp.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {powerUp.status === 'active' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : powerUp.status === 'pending' ? (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <CardDescription>{powerUp.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant={powerUp.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => togglePowerUpStatus(powerUp.id)}
                        className="w-full"
                        disabled={!isPremium}
                      >
                        {!isPremium ? 'Upgrade Required' : powerUp.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
          )}
        </main>
      </div>
    );
  };

export default PowerUps;
