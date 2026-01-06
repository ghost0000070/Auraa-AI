import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import { toast } from "sonner";
import { Loader2, Zap, CheckCircle } from 'lucide-react';
import { AIEmployeeTemplate } from '@/lib/ai-employee-templates.tsx';

interface DeploymentRequestCardProps {
  template: AIEmployeeTemplate;
}

export const DeploymentRequestCard: React.FC<DeploymentRequestCardProps> = ({ template }) => {
  const { user, isSubscriber } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeployed, setIsDeployed] = React.useState(false);

  const handleDeploy = async () => {
    if (!user) {
      toast.error("You must be logged in to deploy AI employees.");
      return;
    }

    if (!isSubscriber) {
      toast.error("You need an active subscription to deploy AI employees.");
      return;
    }

    setIsLoading(true);

    try {
      // Create deployment request directly in Supabase
      const { data: deploymentRequest, error } = await supabase
        .from('deployment_requests')
        .insert({
          user_id: user.id,
          employee_name: template.name,
          employee_category: template.category,
          status: 'pending',
          template_id: template.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Call the deploy-ai-employee edge function to actually process the deployment
      const { data: deployResult, error: deployError } = await supabase.functions.invoke('deploy-ai-employee', {
        body: {
          requestId: deploymentRequest.id,
          userId: user.id,
        },
      });

      if (deployError) {
        console.error("Deployment function error:", deployError);
        // Update request status to failed
        await supabase
          .from('deployment_requests')
          .update({ status: 'failed' })
          .eq('id', deploymentRequest.id);
        throw new Error(deployError.message || 'Failed to deploy AI employee');
      }

      toast.success(`${template.name} has been deployed and is ready to work!`);
      setIsDeployed(true);
    } catch (error) {
      console.error("Error deploying AI employee: ", error);
      toast.error(error instanceof Error ? error.message : "There was an error deploying the AI employee.");
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
            {isLoading ? 'Deploying...' : isDeployed ? 'Deployed' : 'Deploy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
