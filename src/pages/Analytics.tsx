import React, { useState, useEffect, Suspense, lazy } from 'react';
import { db } from "@/firebase";
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OWNER_EMAIL } from '@/config/constants';

// Lazy load the chart components
const SimpleBarChart = lazy(() => import('@/components/SimpleBarChart'));
const SimpleLineChart = lazy(() => import('@/components/SimpleLineChart'));
const SimplePieChart = lazy(() => import('@/components/SimplePieChart'));

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [userCounts, setUserCounts] = useState<ChartData[]>([]);
  const [deploymentCounts, setDeploymentCounts] = useState<ChartData[]>([]);
  const [templateCounts, setTemplateCounts] = useState<ChartData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [loading, setLoading] = useState(true);
  const isAdmin = auth.currentUser?.email === OWNER_EMAIL;

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        if (auth.currentUser.email !== OWNER_EMAIL) {
          toast.error("Access denied. Admin only.");
          navigate('/dashboard');
        }
      }
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return; // Don't fetch if not admin
      
      setLoading(true);
      try {
        // Ensure fresh auth token before Firestore reads
        const auth = getAuth();
        if (auth.currentUser) await auth.currentUser.getIdToken(true);
        
        // Fetch all data in parallel
        const [usersSnapshot, deploymentsSnapshot] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "deployedEmployees"))
        ]);

        setTotalUsers(usersSnapshot.size);
        setTotalDeployments(deploymentsSnapshot.size);

        // Process data for charts
        const processSignups = () => {
            const userSignupCounts: Record<string, number> = {};
            usersSnapshot.forEach(doc => {
              const createdAt = (doc.data().createdAt as Timestamp)?.toDate();
              if (createdAt) {
                const date = createdAt.toISOString().split('T')[0];
                userSignupCounts[date] = (userSignupCounts[date] || 0) + 1;
              }
            });

            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 29 + i);
                return date.toISOString().split('T')[0];
            });

            const userCountsData = last30Days.map(date => ({
                name: date,
                value: userSignupCounts[date] || 0,
            }));

            setUserCounts(userCountsData); 
        };
        
        const processDeployments = () => {
            const deploymentCountsRaw: Record<string, number> = {};
            const templateCountsRaw: Record<string, number> = {};

            deploymentsSnapshot.forEach(doc => {
                const data = doc.data();
                const createdAt = (data.createdAt as Timestamp)?.toDate();
                if (createdAt) {
                    const date = createdAt.toISOString().split('T')[0];
                    deploymentCountsRaw[date] = (deploymentCountsRaw[date] || 0) + 1;
                }
                const templateId = data.templateId;
                if(templateId){
                    templateCountsRaw[templateId] = (templateCountsRaw[templateId] || 0) + 1;
                }
            });

            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 29 + i);
                return date.toISOString().split('T')[0];
            });
            
            const deploymentCountsData = last30Days.map(date => ({
                name: date,
                value: deploymentCountsRaw[date] || 0,
            }));
            setDeploymentCounts(deploymentCountsData);

            const templateCountsData = Object.entries(templateCountsRaw).map(([templateId, value]) => ({
              name: templateId,
              value: value,
              fill: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
            }));
    
            setTemplateCounts(templateCountsData);
        }

        processSignups();
        processDeployments();

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border border-slate-700/50 text-white h-24 animate-pulse"><CardContent/></Card>
            <Card className="bg-slate-800/50 border border-slate-700/50 text-white h-24 animate-pulse"><CardContent/></Card>
            <Card className="col-span-1 md:col-span-2 bg-slate-800/50 border border-slate-700/50 text-white h-64 animate-pulse"><CardContent/></Card>
            <Card className="col-span-1 md:col-span-2 bg-slate-800/50 border border-slate-700/50 text-white h-64 animate-pulse"><CardContent/></Card>
            <Card className="col-span-1 md:col-span-4 bg-slate-800/50 border border-slate-700/50 text-white h-80 animate-pulse"><CardContent/></Card>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-slate-800/50 border border-slate-700/50 text-white">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2 pt-6">Total Users</h2>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border border-slate-700/50 text-white">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2 pt-6">Total AI Deployments</h2>
                <p className="text-3xl font-bold">{totalDeployments}</p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<div className="h-64 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-pulse"></div>}>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">User Signups Over Time</h2>
                <SimpleLineChart data={userCounts} />
              </div>
          </Suspense>

          <Suspense fallback={<div className="h-64 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-pulse"></div>}>
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">AI Employee Deployments Over Time</h2>
                <SimpleBarChart data={deploymentCounts} />
            </div>
          </Suspense>

          <Suspense fallback={<div className="h-80 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-pulse"></div>}>
            <div>
                <h2 className="text-xl font-semibold mb-2">Most Popular AI Employee Templates</h2>
                <SimplePieChart data={templateCounts} />
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default Analytics;
