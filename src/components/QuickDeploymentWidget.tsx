import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-hooks';
import { supabase } from '@/supabase';
import { Rocket, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface EmployeeTemplate {
  id: string;
  name: string;
}

interface DeploymentRequest {
  id: string;
  status: string;
  createdAt: string;
  employeeName: string;
}

export const QuickDeploymentWidget: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmployeeTemplate[]>([]);
  const [recentRequests, setRecentRequests] = useState<DeploymentRequest[]>([]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('id, name, category')
        .limit(10);
      
      if (error) throw error;
      if (data) {
        setTemplates(data.map(t => ({ id: t.id, name: t.name, category: t.category })));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({ title: "Error", description: "Could not fetch employee templates.", variant: "destructive" });
    }
  }, [toast]);

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
    fetchTemplates();
    fetchRecentRequests();
  }, [fetchTemplates, fetchRecentRequests]);

  const handleQuickDeploy = async (template: EmployeeTemplate) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to deploy.", variant: "destructive" });
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
        supabase.functions.invoke('deploy-ai-employee', {
          body: {
            requestId: data.id,
            userId: user.id,
          }
        }).then(({ error: deployError }) => {
          if (deployError) {
            console.error('Auto-deployment error:', deployError);
          }
        });

        toast({ 
          title: "Deployment Started", 
          description: `${template.name} is being deployed automatically.` 
        });
        
    } catch (error) {
      console.error('Quick deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      await fetchRecentRequests(); // Refresh recent requests list
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      pending: <Clock className="w-4 h-4 text-amber-500" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <AlertTriangle className="w-4 h-4 text-red-500" />,
    };
    return icons[status] || <Clock className="w-4 h-4 text-muted-foreground" />;
  };
  
  const recommendedTemplates = templates.filter(t => ['Viral Vortex', 'Deal Striker', 'Word Smith', 'Support Sentinel'].includes(t.name));

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
          {recommendedTemplates.length > 0 ? recommendedTemplates.map((template) => (
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
          )) : <p className='text-xs text-center col-span-2'>Loading templates...</p>}
        </div>

        {recentRequests.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Requests:</p>
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
