import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-hooks';
import { db, functions } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Rocket, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

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
  const [recentRequests, setRecentRequests] = useState<DeploymentRequest[]>([]);

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
      toast({
        title: "Error",
        description: "Could not fetch recent deployment requests.",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRecentRequests();
  }, [fetchRecentRequests]);

  const handleQuickDeploy = async (employeeName: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to deploy.", variant: "destructive" });
      return;
    }

    setIsLoading(employeeName);
    try {
      const templatesQuery = query(collection(db, 'ai_employees'), where('name', '==', employeeName));
      const templateSnapshot = await getDocs(templatesQuery);

      if (templateSnapshot.empty) {
        throw new Error(`Could not find a template for "${employeeName}".`);
      }
      const templateId = templateSnapshot.docs[0].id;

      const newRequestRef = await addDoc(collection(db, 'deploymentRequests'), {
        userId: user.uid,
        employeeId: templateId,
        employeeName: employeeName,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const deployFunction = httpsCallable(functions, 'deployAiEmployee');
      await deployFunction({ requestId: newRequest-ref.id });

      toast({
        title: "Deployment Successful!",
        description: `${employeeName} has been deployed.`,
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
      await fetchRecentRequests();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
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
          {['Viral Vortex', 'Deal Striker', 'Word Smith', 'Support Sentinel'].map((type) => (
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
                <span className="truncate pr-2">{request.employeeName}</span>
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
