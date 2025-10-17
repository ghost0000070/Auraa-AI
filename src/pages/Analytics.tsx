import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartColumn, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import SubscriptionGuard from "@/components/SubscriptionGuard"; // Corrected import
import { Header } from "@/components/Header";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const Analytics = () => {
  const [agentMetrics, setAgentMetrics] = useState({
    activeAgents: 0,
    tasksCompleted: 0,
    uptime: 0,
  });

  useEffect(() => {
    const fetchAgentMetrics = async () => {
      // This is a placeholder for actual data fetching from Supabase
      // In a real application, you would fetch these from your backend
      const { data, error } = await supabase
        .from('agent_metrics')
        .select('active_agents, tasks_completed, uptime')
        .single();

      if (data) {
        setAgentMetrics(data);
      }
      if (error) {
        console.error("Error fetching agent metrics:", error);
      }
    };

    fetchAgentMetrics();
  }, []);

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
                <ChartContainer config={{
                  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
                  mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
                }}
                >
                  {/* <BarChart data={chartData}>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <ChartColumn dataKey="desktop" fill="var(--color-desktop)" />
                    <ChartColumn dataKey="mobile" fill="var(--color-mobile)" />
                  </BarChart> */}
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="week">
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                  </TabsList>
                  <TabsContent value="week">
                    <div className="space-y-8">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium dark:bg-slate-800">OM</div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Olivia Martin</p>
                          <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$1,999.00</div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium dark:bg-slate-800">JL</div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Jackson Lee</p>
                          <p className="text-sm text-muted-foreground">jackson.lee@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$39.00</div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium dark:bg-slate-800">SF</div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Sofia Fernandez</p>
                          <p className="text-sm text-muted-foreground">sofia.fernandez@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$299.00</div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium dark:bg-slate-800">WM</div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">William Miller</p>
                          <p className="text-sm text-muted-foreground">will.miller@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$399.00</div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium dark:bg-slate-800">HS</div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Henry Smith</p>
                          <p className="text-sm text-muted-foreground">henry.smith@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$49.00</div>
                      </div>
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