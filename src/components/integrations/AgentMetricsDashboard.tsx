import { useAgentMetrics } from '@/hooks/useAgentMetrics';

export function AgentMetricsDashboard() {
  const { data: metrics, isLoading, error } = useAgentMetrics();

  if (isLoading) return <div>Loading metrics...</div>;
  if (error) return <div className="text-red-500">Error: {JSON.stringify(error, null, 2)}</div>;

  // Render your metrics dashboard with the `metrics` data
  return (
    <div>
      <h2>Agent Metrics</h2>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}
