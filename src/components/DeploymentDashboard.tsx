import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/supabase';
import { toast } from 'sonner';
import { 
  Clock, CheckCircle, XCircle, Zap, Activity, AlertTriangle, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeploymentRequest {
  id: string;
  createdAt: Date;
  status: string;
  employeeName: string;
  employeeCategory?: string;
  businessName?: string;
}

interface DeployedEmployee {
  id: string;
  createdAt: Date;
  status: string;
  name: string;
  templateId: string;
}

export const DeploymentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeploymentRequest[]>([]);
  const [employees, setEmployees] = useState<DeployedEmployee[]>([]);
  const [loading, setLoading] = useState({ requests: true, employees: true });

  const handleLoading = (type: 'requests' | 'employees', status: boolean) => {
    setLoading(prev => ({ ...prev, [type]: status }));
  };

  const allDataLoaded = !loading.requests && !loading.employees;

  useEffect(() => {
    if (!user) return;

    const setupSubscriptions = async () => {
      try {
        // Fetch initial requests
        handleLoading('requests', true);
        const { data: requestsData } = await supabase
          .from('deployment_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (requestsData) {
          setRequests(requestsData.map((r: any) => ({
            id: r.id,
            createdAt: new Date(r.created_at),
            status: r.status,
            employeeName: r.employee_name,
            employeeCategory: r.employee_category,
            businessName: r.business_name
          })));
        }
        handleLoading('requests', false);

        // Fetch initial employees
        handleLoading('employees', true);
        const { data: employeesData } = await supabase
          .from('deployed_employees')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (employeesData) {
          setEmployees(employeesData.map((e: any) => ({
            id: e.id,
            createdAt: new Date(e.created_at),
            status: e.status,
            name: e.name,
            templateId: e.template_id
          })));
        }
        handleLoading('employees', false);

        // Subscribe to requests real-time
        const requestsChannel = supabase
          .channel('requests_rt')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'deployment_requests', filter: `user_id=eq.${user.id}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newReq = payload.new as any;
                setRequests(prev => [{
                  id: newReq.id,
                  createdAt: new Date(newReq.created_at),
                  status: newReq.status,
                  employeeName: newReq.employee_name,
                  employeeCategory: newReq.employee_category,
                  businessName: newReq.business_name
                }, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedReq = payload.new as any;
                setRequests(prev => prev.map(r => r.id === updatedReq.id ? {
                  id: updatedReq.id,
                  createdAt: new Date(updatedReq.created_at),
                  status: updatedReq.status,
                  employeeName: updatedReq.employee_name,
                  employeeCategory: updatedReq.employee_category,
                  businessName: updatedReq.business_name
                } : r));
              }
            }
          )
          .subscribe();

        // Subscribe to employees real-time
        const employeesChannel = supabase
          .channel('deployed_rt')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'deployed_employees', filter: `user_id=eq.${user.id}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newEmp = payload.new as any;
                setEmployees(prev => [{
                  id: newEmp.id,
                  createdAt: new Date(newEmp.created_at),
                  status: newEmp.status,
                  name: newEmp.name,
                  templateId: newEmp.template_id
                }, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedEmp = payload.new as any;
                setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? {
                  id: updatedEmp.id,
                  createdAt: new Date(updatedEmp.created_at),
                  status: updatedEmp.status,
                  name: updatedEmp.name,
                  templateId: updatedEmp.template_id
                } : e));
              }
            }
          )
          .subscribe();

        return () => {
          requestsChannel.unsubscribe();
          employeesChannel.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        handleLoading('requests', false);
        handleLoading('employees', false);
        toast.error('Failed to load deployment data');
        return () => {};
      }
    };

    const cleanupPromise = setupSubscriptions();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [user]);

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    completed: requests.filter(r => r.status === 'completed').length,
    active: employees.filter(e => e.status === 'active').length,
    total: requests.length + employees.length
  };

  const getStatusUi = (status: string) => {
    const ui: Record<string, { icon: React.ReactElement, color: string }> = {
      pending: { icon: <Clock className="w-4 h-4 text-amber-500" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      completed: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      active: { icon: <Zap className="w-4 h-4 text-green-500" />, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      failed: { icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
      inactive: { icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-500/20 text-red-300 border-red-500/30' }
    };
    return ui[status] || { icon: <AlertTriangle className="w-4 h-4 text-muted-foreground" />, color: 'bg-muted/20 text-muted-foreground border-muted' };
  };

  if (!allDataLoaded) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/> <span className="ml-2">Loading data...</span></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Deployment Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Requests</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed Requests</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Employees</CardTitle><Zap className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Activity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Deployment Requests</TabsTrigger>
          <TabsTrigger value="employees">Deployed Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Requests</CardTitle>
              <CardDescription>Review and manage deployment requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">No deployment requests found.</div> : (
                  <Table>
                      <TableHeader><TableRow><TableHead>Employee Name</TableHead><TableHead>Status</TableHead><TableHead>Requested At</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {requests.map((request) => {
                              const { icon, color } = getStatusUi(request.status);
                              return (
                                  <TableRow key={request.id}>
                                      <TableCell className="font-medium">{request.employeeName}</TableCell>
                                      <TableCell><Badge variant="outline" className={`flex items-center gap-1 w-fit ${color}`}>{icon}<span className="capitalize">{request.status}</span></Badge></TableCell>
                                      <TableCell>{formatDistanceToNow(request.createdAt, { addSuffix: true })}</TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Deployed AI Employees</CardTitle>
              <CardDescription>Monitor your deployed AI employees.</CardDescription>
            </CardHeader>
            <CardContent>
             {employees.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">No deployed employees found.</div> : (
                  <Table>
                      <TableHeader><TableRow><TableHead>Employee Name</TableHead><TableHead>Status</TableHead><TableHead>Deployed At</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {employees.map((employee) => {
                              const { icon, color } = getStatusUi(employee.status);
                              return (
                                  <TableRow 
                                    key={employee.id} 
                                    className="cursor-pointer hover:bg-slate-800/50"
                                    onClick={() => navigate(`/ai-employee/${employee.id}`)}
                                  >
                                      <TableCell className="font-medium">{employee.name}</TableCell>
                                      <TableCell><Badge variant="outline" className={`flex items-center gap-1 w-fit ${color}`}>{icon}<span className="capitalize">{employee.status}</span></Badge></TableCell>
                                      <TableCell>{formatDistanceToNow(employee.createdAt, { addSuffix: true })}</TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
