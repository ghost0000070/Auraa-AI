import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/supabase';
import { Rocket, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { useNavigate } from 'react-router-dom';

interface DeploymentRequest {
  id: string;
  status: string;
  createdAt: string;
  employeeName: string;
}

export const QuickDeploymentWidget: React.FC = () => {
  const { user, isSubscriber } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<DeploymentRequest[]>([]);

  // Use local templates directly - get first 4 for quick deploy
  const quickTemplates = aiEmployeeTemplates.slice(0, 4);

  const fetchRecentRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('deployment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      if (data) {
        setRecentRequests(data.map((r: any) => ({
          id: r.id,
          status: r.status,
          createdAt: r.created_at,
          employeeName: r.employee_name
        })));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentRequests();
  }, [fetchRecentRequests]);

  const handleQuickDeploy = async (template: typeof aiEmployeeTemplates[0]) => {
    if (!user) {
      toast.error("Please sign in to deploy AI employees.");
      navigate('/auth');
      return;
    }

    if (!isSubscriber) {
      toast.error("Upgrade to deploy AI employees.");
      navigate('/pricing');
      return;
    }

    setIsLoading(template.name);
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

        // Automatically trigger deployment via Edge Function
        // Get the current session to pass Authorization header explicitly
        const { data: { session } } = await supabase.auth.getSession();
        supabase.functions.invoke('deploy-ai-employee', {
          body: {
            requestId: data.id,
            userId: user.id,
          },
          headers: session?.access_token ? {
            Authorization: `Bearer ${session.access_token}`,
          } : undefined,
        }).then(({ error: deployError }) => {
          if (deployError) {
            console.error('Auto-deployment error:', deployError);
          }
        });

        toast.success(`Deployment Started: ${template.name} is being deployed.`);
        
    } catch (error) {
      console.error('Quick deploy error:', error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(null);
      await fetchRecentRequests();
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      pending: <Clock className="w-4 h-4 text-amber-500" />,
      processing: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <AlertTriangle className="w-4 h-4 text-red-500" />,
    };
    return icons[status] || <Clock className="w-4 h-4 text-muted-foreground" />;
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
          {quickTemplates.map((template) => (
            <Button
              key={template.id}
              onClick={() => handleQuickDeploy(template)}
              disabled={!!isLoading}
              variant="outline"
              size="sm"
              className="text-xs justify-center"
            >
              {isLoading === template.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-3 h-3 mr-1" />}
              {template.name}
            </Button>
          ))}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/marketplace')}
        >
          View All Templates →
        </Button>

        {recentRequests.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Deployments:</p>
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between text-xs bg-slate-900/30 p-2 rounded">
                <span className="truncate pr-2">{request.employeeName}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {getStatusIcon(request.status)}
                  <Badge variant="outline" className="text-xs capitalize border-slate-600">
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

export default QuickDeploymentWidget;
