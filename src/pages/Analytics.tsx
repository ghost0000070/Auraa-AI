import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from "@/supabase";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from "@/components/ui/card";

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
  const [userCounts, setUserCounts] = useState<ChartData[]>([]);
  const [deploymentCounts, setDeploymentCounts] = useState<ChartData[]>([]);
  const [templateCounts, setTemplateCounts] = useState<ChartData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [usersResult, deploymentsResult] = await Promise.all([
            supabase.from("users").select('*', { count: 'exact' }),
            supabase.from("deployed_employees").select('*')
        ]);

        setTotalUsers(usersResult.count || 0);
        setTotalDeployments(deploymentsResult.data?.length || 0);

        // Process data for charts
        const processSignups = () => {
            const userSignupCounts: Record<string, number> = {};
            usersResult.data?.forEach(user => {
              const createdAt = user.created_at ? new Date(user.created_at) : null;
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

            deploymentsResult.data?.forEach(deployment => {
                const createdAt = deployment.created_at ? new Date(deployment.created_at) : null;
                if (createdAt) {
                    const date = createdAt.toISOString().split('T')[0];
                    deploymentCountsRaw[date] = (deploymentCountsRaw[date] || 0) + 1;
                }
                const templateId = deployment.template_id;
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
  }, []);

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
