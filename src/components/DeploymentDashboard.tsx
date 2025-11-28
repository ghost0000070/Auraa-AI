import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/toast-hooks';
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
  const { toast } = useToast();
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
        // Ensure fresh auth token and properly wait before subscribing
        await user.getIdToken(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const requestsQuery = query(collection(db, 'deploymentRequests'), where('userId', '==', user.uid));
        const employeesQuery = query(collection(db, 'deployedEmployees'), where('userId', '==', user.uid));

        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
          const requestsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: (d.data().createdAt as Timestamp).toDate(),
          } as DeploymentRequest));
          setRequests(requestsData);
          handleLoading('requests', false);
        }, (error) => {
          console.error('[DeploymentDashboard] Error fetching requests:', {
            code: error.code,
            message: error.message,
            fullError: error
          });
          if (error.code === 'permission-denied') {
            console.error('[CRITICAL] Permission denied for deploymentRequests');
          }
          toast({ title: 'Error', description: 'Failed to load deployment requests', variant: 'destructive' });
          handleLoading('requests', false);
        });

        const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
          const employeesData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: (d.data().createdAt as Timestamp).toDate(),
          } as DeployedEmployee));
          setEmployees(employeesData);
          handleLoading('employees', false);
        }, (error) => {
          console.error('[DeploymentDashboard] Error fetching employees:', {
            code: error.code,
            message: error.message,
            fullError: error
          });
          if (error.code === 'permission-denied') {
            console.error('[CRITICAL] Permission denied for deployedEmployees');
          }
          toast({ title: 'Error', description: 'Failed to load deployed employees', variant: 'destructive' });
          handleLoading('employees', false);
        });

        return () => {
          unsubscribeRequests();
          unsubscribeEmployees();
        };
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        handleLoading('requests', false);
        handleLoading('employees', false);
        return () => {};
      }
    };

    const cleanupPromise = setupSubscriptions();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [user, toast]);

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
    return ui[status] || { icon: <AlertTriangle className="w-4 h-4 text-gray-500" />, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
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
              {requests.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">No deployment requests found.</div> : (
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
             {employees.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">No deployed employees found.</div> : (
                  <Table>
                      <TableHeader><TableRow><TableHead>Employee Name</TableHead><TableHead>Status</TableHead><TableHead>Deployed At</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {employees.map((employee) => {
                              const { icon, color } = getStatusUi(employee.status);
                              return (
                                  <TableRow key={employee.id}>
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
