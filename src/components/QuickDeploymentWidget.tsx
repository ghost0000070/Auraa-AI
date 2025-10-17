import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Rocket, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const QuickDeploymentWidget: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  interface DeploymentRequest {
    id: string;
    status: string;
    created_at: string;
    rejection_reason: string | null;
    ai_helper_templates?: { name?: string } | null;
  }
  const [recentRequests, setRecentRequests] = useState<DeploymentRequest[]>([]);

  const fetchRecentRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('ai_employee_deployment_requests')
        .select(`
          id,
          status,
          created_at,
          rejection_reason,
          ai_helper_templates(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Could not fetch recent deployment requests.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRecentRequests();
  }, [user]);

  const handleQuickDeploy = async (employeeName: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to deploy employees.", variant: "destructive" });
      return;
    }

    setIsLoading(employeeName);
    try {
      // 1. Find the AI Helper Template to get its ID
      const { data: template, error: templateError } = await supabase
        .from('ai_helper_templates')
        .select('id')
        .eq('name', employeeName)
        .single();

      if (templateError || !template) {
        throw new Error(`Could not find a template for "${employeeName}".`);
      }

      // 2. Create a deployment request
      const { data: request, error: requestError } = await supabase
        .from('ai_employee_deployment_requests')
        .insert({
          user_id: user.id,
          helper_template_id: template.id,
          status: 'pending', // Will be updated by the edge function
        })
        .select('id')
        .single();

      if (requestError || !request) {
        // The database-level checks might throw an error here (e.g., tier limits)
        const description = requestError?.message.includes('does not meet the minimum tier')
          ? "Your subscription tier does not permit this deployment."
          : requestError?.message.includes('reached the maximum number')
          ? "You have reached the deployment limit for your tier."
          : "Please check your subscription and business profile.";
        throw new Error(`Deployment request failed: ${description}`);
      }

      // 3. Invoke the edge function to execute the deployment
      const { error: functionError } = await supabase.functions.invoke('deploy-ai-employee', {
        body: { deployment_request_id: request.id },
      });

      if (functionError) {
        throw new Error(`Deployment execution failed: ${functionError.message}`);
      }

      toast({
        title: "Deployment Successful!",
        description: `${employeeName} has been deployed.`,
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Quick deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      await fetchRecentRequests(); // Refresh the list to show the new status
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Quick Deploy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['SEO Specialist', 'Sales Manager', 'Content Creator', 'Support Agent'].map((type) => (
            <Button
              key={type}
              onClick={() => handleQuickDeploy(type)}
              disabled={!!isLoading}
              variant="outline"
              size="sm"
              className="text-xs justify-center"
            >
              {isLoading === type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-3 h-3 mr-1" />}
              {type}
            </Button>
          ))}
        </div>

        {recentRequests.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Requests:</p>
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded">
                <span className="truncate pr-2">{request.ai_helper_templates?.name || 'Unknown'}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {getStatusIcon(request.status)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};