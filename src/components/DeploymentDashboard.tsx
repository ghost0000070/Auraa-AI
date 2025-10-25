import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

interface DeploymentRequest {
  id: string;
  createdAt: any; // Firestore timestamp
  status: string;
  deploymentConfig?: any;
  rejectionReason?: string;
  employeeName: string;
  employeeDescription: string;
  employeeCategory: string;
  businessName: string;
}

interface DeployedEmployee {
  id: string;
  deployedAt: any; // Firestore timestamp
  status: string;
  performanceMetrics?: any;
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
      
      // Fetch deployment requests
      const requestsQuery = query(collection(db, 'deploymentRequests'), where('userId', '==', user.uid));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = await Promise.all(requestsSnapshot.docs.map(async (d) => {
        const request = d.data();
        // Assuming employee and business details are stored within the request doc
        // or you might need to fetch them separately if they are in different collections
        return {
          id: d.id,
          ...request,
          createdAt: request.createdAt?.toDate(),
        } as DeploymentRequest;
      }));
      setDeploymentRequests(requestsData);

      // Fetch deployed employees
      const employeesQuery = query(collection(db, 'deployedEmployees'), where('userId', '==', user.uid));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        deployedAt: d.data().deployedAt?.toDate(),
      }) as DeployedEmployee);
      setDeployedEmployees(employeesData);

      // Calculate stats
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

  // ... rest of the component remains the same ...

