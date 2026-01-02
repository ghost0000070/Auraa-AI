import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import { toast } from "@/components/ui/toast-hooks";
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
      // Create deployment request directly in Supabase
      const { data, error } = await supabase
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

      toast({
        title: "Deployment Successful",
        description: `${template.name} deployment request has been submitted.`,
      });
      setIsDeployed(true);
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
