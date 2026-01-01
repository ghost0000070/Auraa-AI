import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast-hooks";
import { db, functions } from "@/firebase";
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';
import { DeploymentDashboard } from '@/components/DeploymentDashboard';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const navigate = useNavigate();
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
      // Check if user has Stripe ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (!userData?.stripeId) {
        // User never subscribed - redirect to pricing
        toast({
          title: "No active subscription",
          description: "Subscribe to unlock premium features.",
        });
        navigate('/pricing');
        return;
      }

      // User has subscribed before - open portal
      const createPortalSession = httpsCallable(functions, 'createCustomerPortalSession');
      const result = await createPortalSession({ 
          returnUrl: window.location.href 
      });
      
      const { url } = result.data as { url: string };
      window.location.href = url;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      toast({
        title: "Error",
        description: "Could not open subscription portal. Please try again.",
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
        const deployFunction = httpsCallable(functions, 'deployAiEmployee');
        const result = await deployFunction({
            deploymentRequest: {
                ai_helper_template_id: template.id,
                name: template.name,
            }
        });
        toast({
            title: "Deployment Successful",
            description: (result.data as { message: string }).message,
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
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b">
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
