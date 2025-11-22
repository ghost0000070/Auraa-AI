import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/toast-hooks";
import { db, functions } from "@/firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';
import { AITeamDebugger } from '@/components/AITeamDebugger';
import { DeploymentDashboard } from '@/components/DeploymentDashboard';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, loading, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  const isSubscriber = subscriptionStatus?.subscribed;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleStripePortal = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to manage your subscription.",
      });
      return;
    }

    try {
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
        description: "Could not create a customer portal session. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Define type for template
  interface Template {
      id: string;
      name: string;
      // other properties
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
        await addDoc(collection(db, 'aiEmployeeDeploymentRequests'), {
            user_id: user.uid,
            ai_helper_template_id: template.id,
            status: 'pending',
            created_at: serverTimestamp(),
        });
        toast({
            title: "Deployment Requested",
            description: `Your request to deploy ${template.name} has been submitted.`,
        });
    } catch (error) {
        console.error("Error creating deployment request: ", error);
        toast({
            title: "Deployment Error",
            description: "There was an error submitting your deployment request.",
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
          <Link to="/auth">
            <Button variant="outline">Logout</Button>
          </Link>
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
                        <div className="mt-6">
                        <AITeamDebugger />
                        </div>
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
