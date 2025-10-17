import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Zap, 
  User, 
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Generic JSON value type compatible with Supabase Json
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface DeploymentRequest {
  id: string;
  created_at: string;
  status: string;
  // Supabase returns JSON (could be object, array, primitive)
  deployment_config: JsonValue | null;
  rejection_reason?: string;
  helper_template: {
    name: string;
    description: string;
    category: string;
  };
  business_profile: {
    name: string;
  };
}

interface DeployedEmployee {
  id: string;
  created_at: string;
  deployed_at: string;
  status: string;
  // Arbitrary JSON metrics from backend.
  performance_metrics: JsonValue | null;
  helper: {
    helper_name: string;
    helper_type: string;
    deployment_status: string;
  };
}

// Safely extract tasks_completed from performance metrics JSON
function extractTasksCompleted(metrics: JsonValue | null): number {
  if (
    metrics &&
    typeof metrics === 'object' &&
    !Array.isArray(metrics) &&
    'tasks_completed' in metrics
  ) {
    const val = (metrics as { tasks_completed?: unknown }).tasks_completed;
    return typeof val === 'number' ? val : 0;
  }
  return 0;
}

export const DeploymentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deploymentRequests, setDeploymentRequests] = useState<DeploymentRequest[]>([]);
  const [deployedEmployees, setDeployedEmployees] = useState<DeployedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    active: 0,
    total: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch deployment requests
      const { data: requests, error: requestsError } = await supabase
        .from('ai_employee_deployment_requests')
        .select(`
          *,
          helper_template:ai_helper_templates(name, description, category),
          business_profile:business_profiles(name)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
      } else {
        setDeploymentRequests(requests || []);
      }

      // Fetch deployed employees
      const { data: employees, error: employeesError } = await supabase
        .from('ai_employee_deployments')
        .select(`
          *,
          helper:helpers(helper_name, helper_type, deployment_status)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
      } else {
        setDeployedEmployees(employees || []);
      }

      // Calculate stats
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const approved = requests?.filter(r => r.status === 'approved').length || 0;
      const active = employees?.filter(e => e.status === 'active').length || 0;
      const total = (requests?.length || 0) + (employees?.length || 0);

      setStats({ pending, approved, active, total });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deployment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'approved':
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
      case 'inactive':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-slate-800/50">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="requests">Deployment Requests</TabsTrigger>
          <TabsTrigger value="deployed">Active Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Deployment Requests
              </CardTitle>
              <CardDescription>
                Track the status of your AI employee deployment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deploymentRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No deployment requests yet</p>
                  <p className="text-sm">Deploy your first AI employee to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deploymentRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-slate-700/50 rounded-lg bg-slate-900/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(request.status)}
                            <h3 className="font-semibold">
                              {request.helper_template?.name || 'Unknown Employee'}
                            </h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.helper_template?.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                            <span>Category: {request.helper_template?.category}</span>
                          </div>
                          {request.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
                              <strong>Rejection Reason:</strong> {request.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployed" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Active AI Employees
              </CardTitle>
              <CardDescription>
                Manage your deployed AI team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployedEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active employees yet</p>
                  <p className="text-sm">Your approved employees will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deployedEmployees.map((employee) => (
                    <div key={employee.id} className="p-4 border border-slate-700/50 rounded-lg bg-slate-900/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(employee.status)}
                            <h3 className="font-semibold">
                              {employee.helper?.helper_name || 'Unknown Employee'}
                            </h3>
                            <Badge className={getStatusColor(employee.status)}>
                              {employee.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Deployed {formatDistanceToNow(new Date(employee.deployed_at || employee.created_at), { addSuffix: true })}
                            </span>
                            <span>Type: {employee.helper?.helper_type}</span>
                          </div>
                          {employee.performance_metrics && (
                            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-sm">
                              <strong>Performance:</strong> Tasks completed: {extractTasksCompleted(employee.performance_metrics)}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};