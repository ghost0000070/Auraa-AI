import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { db } from "@/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Header } from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
};

const Analytics = () => {
  const { user } = useAuth();
  const [agentMetrics, setAgentMetrics] = useState({
    activeAgents: 0,
    tasksCompleted: 0,
    uptime: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchAgentMetrics = async () => {
      try {
        const sevenDaysAgo = Timestamp.now().toMillis() - 7 * 24 * 60 * 60 * 1000;
        const analyticsQuery = query(
          collection(db, "user_analytics"),
          where("userId", "==", user.uid),
          where("timestamp", ">=", new Date(sevenDaysAgo))
        );
        const querySnapshot = await getDocs(analyticsQuery);
        const analyticsData = querySnapshot.docs.map(doc => doc.data());

        const tasksCompleted = analyticsData.filter(d => d.action === 'task_completed').length;
        
        setAgentMetrics(prev => ({ ...prev, tasksCompleted }));

        // Aggregate data for chart
        const dailyData = analyticsData.reduce((acc, curr) => {
          const date = curr.timestamp.toDate().toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { desktop: 0, mobile: 0 };
          }
          if (curr.device === 'desktop') {
            acc[date].desktop++;
          } else {
            acc[date].mobile++;
          }
          return acc;
        }, {});

        const formattedChartData = Object.keys(dailyData).map(date => ({
          month: new Date(date).toLocaleString('default', { month: 'short', day: 'numeric' }),
          ...dailyData[date],
        }));
        setChartData(formattedChartData);

      } catch (error) {
        console.error("Error fetching agent metrics:", error);
      }
    };

    const fetchSalesData = async () => {
      try {
        const salesQuery = query(
          collection(db, "sales"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(salesQuery);
        const sales = querySnapshot.docs.map(doc => doc.data());
        setSalesData(sales);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };


    fetchAgentMetrics();
    fetchSalesData();
  }, [user]);

  return (
    <SubscriptionGuard requiredTier="Enterprise">
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Analytics Dashboard</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active AI Agents</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.activeAgents}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.tasksCompleted}</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.uptime}%</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig}>
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made {salesData.length} sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="week">
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                  </TabsList>
                  <TabsContent value="week">
                    <div className="space-y-4">
                      {salesData.map((sale, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sale.customerName}</p>
                            <p className="text-sm text-muted-foreground">{sale.product}</p>
                          </div>
                          <p className="font-medium">+${sale.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SubscriptionGuard>
  );
};

export default Analytics;
