import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from "@/components/ui/toast-hooks";
import { Loader2, Zap, CheckCircle } from 'lucide-react';
import { AIEmployeeTemplate } from '@/lib/ai-employee-templates';

interface DeploymentRequestCardProps {
  template: AIEmployeeTemplate;
}

export const DeploymentRequestCard: React.FC<DeploymentRequestCardProps> = ({ template }) => {
  const { user, isSubscriber } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeployed, setIsDeployed] = React.useState(false);

  const handleDeploy = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to deploy AI employees.",
        variant: "destructive",
      });
      return;
    }

    if (!isSubscriber) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to deploy AI employees.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const deployAiEmployee = httpsCallable(functions, 'deployAiEmployee');
      const result = await deployAiEmployee({
        deploymentRequest: {
          user_id: user.uid,
          ai_helper_template_id: template.id,
          status: 'pending',
          deployment_config: {},
        }
      });
      
      if ((result.data as {success: boolean}).success) {
        toast({
          title: "Deployment Successful",
          description: `${template.name} has been deployed.`,
        });
        setIsDeployed(true);
      } else {
        throw new Error("Deployment failed");
      }
    } catch (error) {
      console.error("Error deploying AI employee: ", error);
      toast({
        title: "Deployment Error",
        description: "There was an error deploying the AI employee.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Badge>{template.category}</Badge>
          <Button onClick={handleDeploy} disabled={isLoading || isDeployed}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isDeployed ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isDeployed ? 'Deployed' : 'Deploy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
