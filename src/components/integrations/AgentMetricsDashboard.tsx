import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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
  
  if (!metrics || metrics.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed border-border">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-20"/>
            <p>No agent metrics available yet.</p>
        </div>
      );
  }

  // Helper to determine icon based on metric name
  const getIcon = (name: string) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('error') || lowerName.includes('fail')) return <AlertCircle className="h-4 w-4 text-red-500" />;
      if (lowerName.includes('success') || lowerName.includes('complete')) return <CheckCircle className="h-4 w-4 text-green-500" />;
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
         <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {metric.name as string || 'Unknown Metric'}
                </CardTitle>
                {getIcon(metric.name as string || '')}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : String(metric.value)}
                </div>
                <p className="text-xs text-muted-foreground">
                    {metric.timestamp && typeof metric.timestamp === 'object' && 'seconds' in metric.timestamp 
                        ? new Date((metric.timestamp as {seconds: number}).seconds * 1000).toLocaleDateString() 
                        : 'Just now'}
                </p>
            </CardContent>
         </Card>
      ))}
    </div>
  );
}
