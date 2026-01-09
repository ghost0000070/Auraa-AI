import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, Lightbulb, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeActivity {
  employee_id: string;
  employee_name: string;
  category: string;
  total_actions: number;
  actions_24h: number;
  insights_generated: number;
  last_action_at: string | null;
  latest_action: string | null;
}

interface BusinessInsight {
  id: string;
  employee_name: string;
  category: string;
  title: string;
  insight: string;
  recommended_action: string | null;
  is_actionable: boolean;
  created_at: string;
}

interface AutonomousAction {
  id: string;
  employee_name: string;
  action_type: string;
  action_title: string;
  status: string;
  result: string | null;
  created_at: string;
}

export function EmployeeActivityDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [actions, setActions] = useState<AutonomousAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employee activity summary
        const { data: activityData } = await supabase
          .rpc('get_my_employee_activity');
        setActivities(activityData || []);

        // Fetch recent insights
        const { data: insightsData } = await supabase
          .rpc('get_recent_business_insights', { p_limit: 10 });
        setInsights(insightsData || []);

        // Fetch recent actions
        const { data: actionsData } = await supabase
          .rpc('get_recent_autonomous_actions', { p_limit: 20 });
        setActions(actionsData || []);
      } catch (error) {
        console.error('Failed to fetch employee activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('employee-activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'autonomous_actions' },
        () => fetchData()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'business_insights' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      market: 'bg-blue-500',
      competitor: 'bg-red-500',
      customer: 'bg-green-500',
      product: 'bg-purple-500',
      operations: 'bg-orange-500',
      strategy: 'bg-indigo-500',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-500';
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'research': return <Brain className="h-4 w-4" />;
      case 'analyze': return <Activity className="h-4 w-4" />;
      case 'create_content': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employee Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0 && insights.length === 0 && actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employee Activity
          </CardTitle>
          <CardDescription>
            Your AI employees work autonomously every 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet. Your employees will start working soon!</p>
            <p className="text-sm mt-2">
              Make sure you have at least one active employee and a business profile set up.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Employee Activity
        </CardTitle>
        <CardDescription>
          Your AI employees work autonomously every 5 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">
              Insights ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="actions">
              Actions ({actions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4">
              {activities.map((activity) => (
                <div
                  key={activity.employee_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{activity.employee_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {activity.category}
                      </Badge>
                    </div>
                    {activity.latest_action && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        Latest: {activity.latest_action}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {activity.actions_24h}
                      </div>
                      <div className="text-xs">24h</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {activity.insights_generated}
                      </div>
                      <div className="text-xs">Insights</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.last_action_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={cn(
                              'text-white text-xs',
                              getCategoryColor(insight.category)
                            )}
                          >
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {insight.employee_name}
                          </span>
                        </div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.insight}
                        </p>
                        {insight.recommended_action && (
                          <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Recommended:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {insight.recommended_action}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(insight.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="mt-0.5 p-2 rounded-full bg-primary/10">
                      {getActionTypeIcon(action.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {action.employee_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {action.action_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(action.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {action.action_title}
                      </p>
                      {action.result && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {action.result}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
