import React, { useState, useEffect } from 'react';
import SimpleBarChart from '@/components/SimpleBarChart';
import SimpleLineChart from '@/components/SimpleLineChart';
import SimplePieChart from '@/components/SimplePieChart';
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';

const Analytics = () => {
  const [userCounts, setUserCounts] = useState<any>([]);
  const [deploymentCounts, setDeploymentCounts] = useState<any>([]);
  const [templateCounts, setTemplateCounts] = useState<any>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ensure fresh auth token before Firestore reads
        const auth = (await import('firebase/auth')).getAuth();
        if (auth.currentUser) await auth.currentUser.getIdToken(true);
        
        // 1. Fetch Total Users
        const usersSnapshot = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnapshot.size);

        // 2. Fetch Total Deployments
        const deploymentsSnapshot = await getDocs(collection(db, "deployedEmployees"));
        setTotalDeployments(deploymentsSnapshot.size);

        // 3. Fetch User Signups Over Time (last 30 days)
        const userQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(1000) // Assuming you won't have more than 1000 signups in 30 days
        );
        const userQuerySnapshot = await getDocs(userQuery);
        const userCountsData: { name: string; value: number }[] = [];
        const userSignupCounts: Record<string, number> = {};
        userQuerySnapshot.forEach(doc => {
          const createdAt = (doc.data().createdAt as Timestamp)?.toDate();
          if (createdAt) {
            const date = createdAt.toISOString().split('T')[0];
            userSignupCounts[date] = (userSignupCounts[date] || 0) + 1;
          }
        });

        // Get last 30 days for chart display
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 29 + i);
            return date.toISOString().split('T')[0];
        });

        last30Days.forEach(date => {
            userCountsData.push({ name: date, value: userSignupCounts[date] || 0 });
        });

        setUserCounts(userCountsData.reverse());


        // 4. Fetch AI Employee Deployments Over Time (last 30 days)
        const deploymentQuery = query(
            collection(db, "deployedEmployees"),
            orderBy("createdAt", "desc"),
            limit(1000) // Assuming you won't have more than 1000 deployments in 30 days
        );

        const deploymentQuerySnapshot = await getDocs(deploymentQuery);
        const deploymentCountsData: { name: string; value: number }[] = [];
        const deploymentCountsRaw: Record<string, number> = {};
        deploymentQuerySnapshot.forEach(doc => {
            const createdAt = (doc.data().createdAt as Timestamp)?.toDate();
            if (createdAt) {
                const date = createdAt.toISOString().split('T')[0];
                deploymentCountsRaw[date] = (deploymentCountsRaw[date] || 0) + 1;
            }
        });
        
        last30Days.forEach(date => {
            deploymentCountsData.push({ name: date, value: deploymentCountsRaw[date] || 0 });
        });
        setDeploymentCounts(deploymentCountsData.reverse());

        // 5. Fetch Most Popular AI Employee Templates
        const templateCountsRaw: Record<string, number> = {};
        deploymentsSnapshot.forEach(doc => {
          const templateId = doc.data().templateId;
          templateCountsRaw[templateId] = (templateCountsRaw[templateId] || 0) + 1;
        });

        const templateCountsData = Object.entries(templateCountsRaw).map(([templateId, value]) => ({
          name: templateId,
          value: value,
          fill: '#'+Math.floor(Math.random()*16777215).toString(16) // Random color
        }));

        setTemplateCounts(templateCountsData);
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
        <p>Loading analytics data...</p>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-slate-800/50 border border-slate-700/50 text-white">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">Total Users</h2>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border border-slate-700/50 text-white">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">Total AI Deployments</h2>
                <p className="text-3xl font-bold">{totalDeployments}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">User Signups Over Time</h2>
            <SimpleLineChart data={userCounts} />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">AI Employee Deployments Over Time</h2>
            <SimpleBarChart data={deploymentCounts} />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Most Popular AI Employee Templates</h2>
            <SimplePieChart data={templateCounts} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;