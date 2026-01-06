import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export function AgentMetricsDashboard() {
  const { data: metrics, isLoading, error } = useAgentMetrics();

  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-1/2 bg-secondary rounded"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-1/3 bg-secondary rounded"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  if (error) {
      return (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2"/>
            <span>Error loading metrics: {(error as Error).message}</span>
        </div>
      );
  }
  
  if (!metrics) {
      return (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed border-border">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-20"/>
            <p>No agent metrics available yet.</p>
        </div>
      );
  }

  // Metrics is an object with these properties: totalTasks, completedTasks, failedTasks, pendingTasks, successRate, avgResponseTime
  const metricCards = [
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      icon: <BarChart3 className="h-4 w-4 text-blue-500" />,
    },
    {
      title: 'Completed',
      value: metrics.completedTasks,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      title: 'Failed',
      value: metrics.failedTasks,
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    },
    {
      title: 'Pending',
      value: metrics.pendingTasks,
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
    },
    {
      title: 'Avg Response Time',
      value: metrics.avgResponseTime ? `${metrics.avgResponseTime.toFixed(1)}s` : 'N/A',
      icon: <Activity className="h-4 w-4 text-purple-500" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metricCards.map((metric) => (
         <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {metric.title}
                </CardTitle>
                {metric.icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </div>
            </CardContent>
         </Card>
      ))}
    </div>
  );
}
