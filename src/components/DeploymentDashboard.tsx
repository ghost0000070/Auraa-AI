import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
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
  AlertTriangle,
  ArrowRight
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
  deploymentConfig?: Record<string, unknown>;
  rejectionReason?: string;
  employeeName: string;
  employeeDescription: string;
  employeeCategory: string;
  businessName: string;
}

interface DeployedEmployee {
  id: string;
  deployedAt: Date; 
  status: string;
  performanceMetrics?: Record<string, unknown>;
  employeeName: string;
  employeeType: string;
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
    if (!user) return;
    try {
      setLoading(true);
      
      const requestsQuery = query(collection(db, 'deploymentRequests'), where('userId', '==', user.uid));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = await Promise.all(requestsSnapshot.docs.map(async (d) => {
        const request = d.data();
        return {
          id: d.id,
          ...request,
          createdAt: request.createdAt instanceof Timestamp ? request.createdAt.toDate() : new Date(request.createdAt),
        } as DeploymentRequest;
      }));
      setDeploymentRequests(requestsData);

      const employeesQuery = query(collection(db, 'deployedEmployees'), where('userId', '==', user.uid));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(d => {
          const employee = d.data();
          return {
            id: d.id,
            ...employee,
            deployedAt: employee.deployedAt instanceof Timestamp ? employee.deployedAt.toDate() : new Date(employee.deployedAt),
          } as DeployedEmployee;
      });
      setDeployedEmployees(employeesData);

      const pending = requestsData.filter(r => r.status === 'pending').length;
      const approved = requestsData.filter(r => r.status === 'approved').length;
      const active = employeesData.filter(e => e.status === 'active').length;
      const total = requestsData.length + employeesData.length;

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
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Deployment Dashboard</h1>
      {/* Cards for stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Ready to deploy</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total records</p>
            </CardContent>
        </Card>
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
              <CardDescription>Review and manage pending, approved, and rejected deployment requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : deploymentRequests.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No deployment requests found.</div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Employee Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Business Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Requested At</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {deploymentRequests.map((request) => (
                              <TableRow key={request.id}>
                                  <TableCell className="font-medium">{request.employeeName}</TableCell>
                                  <TableCell>{request.employeeCategory}</TableCell>
                                  <TableCell>{request.businessName}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${getStatusColor(request.status)}`}>
                                          {getStatusIcon(request.status)}
                                          <span className="capitalize">{request.status}</span>
                                      </Badge>
                                  </TableCell>
                                  <TableCell>{request.createdAt ? formatDistanceToNow(request.createdAt, { addSuffix: true }) : 'N/A'}</TableCell>
                              </TableRow>
                          ))}
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
              <CardDescription>Monitor the status and performance of your deployed AI employees.</CardDescription>
            </CardHeader>
            <CardContent>
             {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : deployedEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No deployed employees found.</div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Employee Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Deployed At</TableHead>
                              <TableHead>Performance</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {deployedEmployees.map((employee) => (
                              <TableRow key={employee.id}>
                                  <TableCell className="font-medium">{employee.employeeName}</TableCell>
                                  <TableCell>{employee.employeeType}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${getStatusColor(employee.status)}`}>
                                          {getStatusIcon(employee.status)}
                                          <span className="capitalize">{employee.status}</span>
                                      </Badge>
                                  </TableCell>
                                  <TableCell>{employee.deployedAt ? formatDistanceToNow(employee.deployedAt, { addSuffix: true }) : 'N/A'}</TableCell>
                                  <TableCell>
                                    {employee.performanceMetrics ? (
                                        <div className="flex flex-col text-xs">
                                            {Object.entries(employee.performanceMetrics).slice(0, 2).map(([key, value]) => (
                                                <span key={key}>{key}: {String(value)}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No metrics yet</span>
                                    )}
                                  </TableCell>
                              </TableRow>
                          ))}
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
