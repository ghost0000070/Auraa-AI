import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/supabase";

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { AITeamCoordinationPanel } from '@/components/AITeamCoordinationPanel';
import { MyEmployeesPanel } from '@/components/MyEmployeesPanel';
import { EmployeeActivityDashboard } from '@/components/EmployeeActivityDashboard';

export default function Dashboard() {
  const { user, loading, subscriptionStatus, signOut } = useAuth();
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

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
        <Tabs defaultValue="employees">
            <TabsList className="mb-4">
                <TabsTrigger value="employees">My Employees</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="team">Team Overview</TabsTrigger>
                <TabsTrigger value="coordination">Coordination</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="employees">
                <MyEmployeesPanel />
            </TabsContent>
            
            <TabsContent value="activity">
                <EmployeeActivityDashboard />
            </TabsContent>
            
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
