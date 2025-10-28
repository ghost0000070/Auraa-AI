
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

import AITeamDashboard from '@/components/AITeamDashboard';
import { QuickDeploymentWidget } from '@/components/QuickDeploymentWidget';

export default function Dashboard() {
  const { user, loading, isSubscriber } = useAuth();
  const navigate = useNavigate();

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
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.uid }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      toast({
        title: "Error",
        description: "Could not create a customer portal session.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeploy = async (template) => {
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

        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
                <AITeamDashboard />
            </div>
            <div className="md:col-span-1">
                <QuickDeploymentWidget onDeploy={handleDeploy} />
            </div>
        </div>

      </main>
    </div>
  );
}
