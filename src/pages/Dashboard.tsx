import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast-hooks";
import { supabase } from "@/supabase";

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';
import { DeploymentDashboard } from '@/components/DeploymentDashboard';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, loading, isAdmin, subscriptionStatus, signOut } = useAuth();

  const isSubscriber = isAdmin || subscriptionStatus?.subscribed;

  const handleStripePortal = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to manage your subscription.",
      });
      return;
    }

    try {
      // TODO: Integrate with Polar.sh for subscription management
      toast({
        title: "Coming Soon",
        description: "Subscription management with Polar.sh is being integrated. Please contact support.",
      });
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      toast({
        title: "Error",
        description: "Could not create a customer portal session. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  interface Template {
      id: string;
      name: string;
  }

  const handleDeploy = async (template: Template) => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to deploy AI employees.",
            variant: "destructive",
        });
        return;
    }

    try {
        const { error } = await supabase
          .from('deployment_requests')
          .insert({
            user_id: user.id,
            employee_name: template.name,
            status: 'pending',
            template_id: template.id,
          });

        if (error) throw error;

        toast({
            title: "Deployment Successful",
            description: `Deployment request for ${template.name} has been submitted.`,
        });
    } catch (error) {
        console.error("Error deploying AI employee:", error);
        toast({
            title: "Deployment Error",
            description: "There was an error deploying your AI employee.",
            variant: "destructive",
        });
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
          <Button onClick={handleStripePortal}>Manage Subscription</Button>
          <Button variant="outline" onClick={signOut}>Logout</Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {!isSubscriber && (
          <div className="p-4 mb-6 text-center text-white bg-red-500 rounded-lg">
            <p>Your subscription is not active. Please <Button variant="link" className="text-white" onClick={handleStripePortal}>subscribe</Button> to use the AI features.</p>
          </div>
        )}

        <Tabs defaultValue="team">
            <TabsList className="mb-4">
                <TabsTrigger value="team">Team Dashboard</TabsTrigger>
                <TabsTrigger value="deployment">Deployment</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <AITeamDashboard />
                    </div>
                    <div className="md:col-span-1">
                        <QuickDeploymentWidget onDeploy={handleDeploy} />
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="deployment">
                <DeploymentDashboard />
            </TabsContent>
            
            <TabsContent value="analytics">
                <AnalyticsSection />
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
