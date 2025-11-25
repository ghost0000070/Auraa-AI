import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-hooks';
import { db, functions } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Rocket, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface EmployeeTemplate {
  id: string;
  name: string;
}

interface DeploymentRequest {
  id: string;
  status: string;
  createdAt: Timestamp;
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
      const templatesQuery = query(collection(db, 'ai_employee_templates'));
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({ title: "Error", description: "Could not fetch employee templates.", variant: "destructive" });
    }
  }, [toast]);

  const fetchRecentRequests = useCallback(async () => {
    if (!user) return;
    try {
      const requestsQuery = query(
        collection(db, 'deploymentRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeploymentRequest));
      setRecentRequests(requests);
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
        const deployFunction = httpsCallable(functions, 'deployAiEmployee');
        const result = await deployFunction({
            deploymentRequest: {
                ai_helper_template_id: template.id,
                name: template.name,
            }
        });

        toast({ 
          title: "Deployment Requested", 
          description: (result.data as { message: string }).message 
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
    return icons[status] || <Clock className="w-4 h-4 text-gray-500" />;
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
