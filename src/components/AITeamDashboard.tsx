import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target, 
  Brain,
  ArrowUpRight,
  PlayCircle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  activeWorkflows: number;
  completedTasks: number;
  teamMessages: number;
  businessGoals: number;
  unreadMessages: number;
  runningExecutions: number;
}

const AITeamDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkflows: 0,
    completedTasks: 0,
    teamMessages: 0,
    businessGoals: 0,
    unreadMessages: 0,
    runningExecutions: 0
  });
  interface ExecutionActivityItem {
    type: 'execution';
    data: { id: string; status: string; created_at: string; current_step?: number }; // minimal fields used
    timestamp: string;
  }
  interface CommunicationActivityItem {
    type: 'communication';
    data: { id: string; message_type: string; created_at: string; is_read: boolean; sender_employee?: string; content?: string };
    timestamp: string;
  }
  type ActivityItem = ExecutionActivityItem | CommunicationActivityItem;
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching AI team dashboard data...');
      
      // Fetch data from all required tables - use proper table names 
      const [
        workflowsResponse,
        executionsResponse,
        communicationsResponse,
        goalsResponse
      ] = await Promise.all([
        supabase.from('ai_workflows').select('*').eq('is_active', true),
        supabase.from('ai_team_executions').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('ai_team_communications').select('*').order('created_at', { ascending: false }),
        supabase.from('business_profiles').select('*')
      ]);

      if (workflowsResponse.error) console.warn('Workflows query error:', workflowsResponse.error);
      if (executionsResponse.error) console.warn('Executions query error:', executionsResponse.error);
      if (communicationsResponse.error) console.warn('Communications query error:', communicationsResponse.error);
      if (goalsResponse.error) console.warn('Goals query error:', goalsResponse.error);

      console.log('📊 Dashboard data fetched successfully');

      const completedExecutions = executionsResponse.data?.filter(e => e.status === 'completed').length || 0;
      const unreadMessages = communicationsResponse.data?.filter(c => !c.is_read).length || 0;
      const runningExecutions = executionsResponse.data?.filter(e => e.status === 'running').length || 0;

      console.log('📈 Calculated stats:', {
        completedExecutions,
        unreadMessages,
        runningExecutions
      });

      setStats({
        activeWorkflows: workflowsResponse.data?.length || 0,
        completedTasks: completedExecutions,
        teamMessages: communicationsResponse.data?.length || 0,
        businessGoals: goalsResponse.data?.length || 0,
        unreadMessages,
        runningExecutions
      });

      // Recent activity from executions and communications
      const activity = [
        ...(executionsResponse.data || []).map(e => ({
          type: 'execution' as const,
          data: e,
          timestamp: e.created_at
        })),
        ...(communicationsResponse.data || []).slice(0, 3).map(c => ({
          type: 'communication' as const,
          data: c,
          timestamp: c.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

      console.log('📋 Recent activity items:', activity.length);
      setRecentActivity(activity);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, status?: string) => {
    if (type === 'execution') {
      switch (status) {
        case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'failed': return <Activity className="w-4 h-4 text-red-500" />;
        case 'running': return <PlayCircle className="w-4 h-4 text-blue-500" />;
        default: return <Clock className="w-4 h-4 text-yellow-500" />;
      }
    }
    return <MessageSquare className="w-4 h-4 text-purple-500" />;
  };

  const quickActions = [
    {
      title: 'Create Workflow',
      description: 'Build a new AI team workflow',
      icon: Users,
      action: () => window.location.href = '/ai-team-workflows',
      color: 'bg-blue-500'
    },
    {
      title: 'Set Business Goal',
      description: 'Define a new business objective',
      icon: Target,
      action: () => window.location.href = '/business-intelligence',
      color: 'bg-green-500'
    },
    {
      title: 'View Team Chat',
      description: 'Check team communications',
      icon: MessageSquare,
      action: () => window.location.href = '/ai-team-coordination',
      color: 'bg-purple-500'
    },
    {
      title: 'AI Insights',
      description: 'Review shared knowledge',
      icon: Brain,
      action: () => window.location.href = '/business-intelligence',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="text-muted-foreground ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+23%</span>
              <span className="text-muted-foreground ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Messages</p>
                <p className="text-2xl font-bold">{stats.teamMessages}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            {stats.unreadMessages > 0 && (
              <div className="flex items-center mt-4">
                <Badge variant="destructive" className="text-xs">
                  {stats.unreadMessages} unread
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Goals</p>
                <p className="text-2xl font-bold">{stats.businessGoals}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-muted-foreground">Active objectives</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type, activity.type === 'execution' ? activity.data.status : undefined)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {activity.type === 'execution' 
                            ? `Workflow execution ${activity.data.status}`
                            : `New message from ${activity.data.sender_employee || 'System'}`
                          }
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'execution' 
                          ? `Step ${activity.data.current_step || 1} • ${activity.data.status}`
                          : activity.data.content?.slice(0, 80) + '...'
                        }
                      </p>
                    </div>
                  </div>
                ))}

                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity. Start by creating a workflow!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4"
                      onClick={action.action}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Running Executions */}
      {stats.runningExecutions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="w-5 h-5 mr-2" />
              Currently Running
              <Badge variant="default" className="ml-2">
                {stats.runningExecutions} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Your AI team is currently processing {stats.runningExecutions} workflow execution{stats.runningExecutions > 1 ? 's' : ''}.
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.location.href = '/ai-team-coordination'}>
                View details →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AITeamDashboard;