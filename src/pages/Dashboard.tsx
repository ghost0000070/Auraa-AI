import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/supabase";
import { useNavigate } from "react-router-dom";

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { AITeamCoordinationPanel } from '@/components/AITeamCoordinationPanel';
import { Key, Calendar, FileText, CreditCard, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const { user, loading, subscriptionStatus, signOut } = useAuth();
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error("You must be signed in to manage your subscription.");
      return;
    }

    setIsManagingSubscription(true);

    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Call the Polar subscription handler edge function
      const { data, error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'get-portal-url',
          successUrl: window.location.href
        }
      });

      if (error) throw error;

      if (data?.portalUrl) {
        // Redirect to Polar customer portal
        window.location.href = data.portalUrl;
      } else if (data?.error) {
        // No subscription found - offer to create one
        if (!data.hasSubscription) {
          toast.info("You don't have an active subscription. Redirecting to pricing...");
          // Redirect to pricing page after a short delay
          setTimeout(() => {
            window.location.href = '/pricing';
          }, 1500);
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast.error(error instanceof Error ? error.message : "Could not access subscription management. Please try again later.");
    } finally {
      setIsManagingSubscription(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="text-lg text-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 bg-card border-b border-border">
        <h1 className="text-2xl font-bold">Auraa Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={handleManageSubscription} disabled={isManagingSubscription}>
            {isManagingSubscription ? "Loading..." : "Manage Subscription"}
          </Button>
          <Button variant="outline" onClick={signOut}>Logout</Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-2 mb-6 p-3 bg-card/50 rounded-lg border border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate('/scheduling')} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Scheduling
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/logs')} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Agent Logs
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/api-keys')} className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/billing')} className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/audit')} className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Audit Trail
          </Button>
        </div>

        <Tabs defaultValue="team">
            <TabsList className="mb-4">
                <TabsTrigger value="team">Team Dashboard</TabsTrigger>
                <TabsTrigger value="coordination">AI Team Coordination</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <AITeamDashboard />
                    </div>
                    <div className="md:col-span-1">
                        <QuickDeploymentWidget />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="coordination">
              <div className="space-y-6">
                <AITeamCoordinationPanel variant="embedded" />
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
                <AnalyticsSection />
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
