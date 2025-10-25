import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import AITeamDashboard from "@/components/AITeamDashboard";
import { Header } from "@/components/Header";

interface DashboardMetrics {
  aiEmployees: number;
  tasksCompleted: number;
  timeSaved: number;
  costSavings: number;
}

const Dashboard = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    aiEmployees: 0,
    tasksCompleted: 0,
    timeSaved: 0,
    costSavings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardMetrics();
    trackPageView();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const trackPageView = async () => {
    try {
      await supabase.from('user_analytics').insert({
        event_type: 'page_view',
        page_path: '/dashboard',
        event_data: { 
          subscription_tier: subscriptionStatus?.subscription_tier || 'free',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Silently handle analytics errors to prevent UI disruption
      console.debug('Analytics tracking failed:', error);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from database
      const { data: helpers, error: helpersError } = await supabase
        .from('helpers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_deployed', true);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: usage, error: usageError } = await supabase
        .from('ai_employee_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${currentMonth}-01`);

      if (helpersError) console.warn('Helpers query error:', helpersError);
      if (usageError) console.warn('Usage query error:', usageError);

      console.log('📊 Dashboard metrics fetched successfully');

      // Calculate metrics with safe defaults
      const completedTasks = usage?.filter(u => u.success).length || 0;
      const avgTimePerTask = 2.5; // hours saved per task
      const avgCostPerTask = 35; // cost savings per task in dollars
      
      setMetrics({
        aiEmployees: helpers?.length || 0,
        tasksCompleted: completedTasks,
        timeSaved: Math.round(completedTasks * avgTimePerTask),
        costSavings: Math.round(completedTasks * avgCostPerTask)
      });

    } catch (error) {
      // Only show user-facing error for unexpected issues
      console.debug('Error fetching dashboard metrics:', error);
      // Don't show toast for data loading issues
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!subscriptionStatus?.subscribed) {
      toast.error("Subscription Required", {
        description: "Creating AI Employees requires an active subscription.",
      });
      return;
    }

    // Track the action silently (fire and forget)
    supabase.from('user_analytics').insert({
      event_type: 'action_click',
      event_data: { 
        action: 'create_ai_employee',
        subscription_tier: subscriptionStatus.subscription_tier
      }
    });

    // Navigate to AI employees page
    navigate('/ai-employees');
  };

  const handleViewAnalytics = async () => {
    // Track analytics access silently (fire and forget)
  supabase.from('user_analytics').insert({
    event_type: 'action_click',
    event_data: { 
      action: 'view_analytics',
      subscription_tier: subscriptionStatus?.subscription_tier || 'free'
    }
  });

    // Navigate to analytics page
    navigate('/analytics');
  };

  const quickActions = [
    {
      title: "Create AI Employee",
      description: "Set up a new AI employee for your team",
      icon: "🤖",
      action: handleCreateEmployee,
      requiresSubscription: true
    },
    {
      title: "View Analytics",
      description: "Check performance metrics and insights",
      icon: "📊", 
      action: handleViewAnalytics,
      requiresSubscription: false
    },
    {
      title: "Manage Team",
      description: "Add or remove team members",
      icon: "👥",
      action: () => {
        supabase.from('user_analytics').insert({
          event_type: 'action_click',
          event_data: { action: 'manage_team' }
        });
        navigate('/power-ups');
      },
      requiresSubscription: false
    },
    {
      title: "Power-Ups",
      description: "Use AI-powered tools and automation",
      icon: "🔗",
      action: () => {
        supabase.from('user_analytics').insert({
          event_type: 'action_click',
          event_data: { action: 'power_ups' }
        });
        navigate('/power-ups');
      },
      requiresSubscription: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your AI workforce and view performance insights
          </p>
        </div>

        {!subscriptionStatus?.subscribed && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Upgrade to Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Get full access to AI employees, analytics, and premium features
                  </p>
                </div>
                <Button variant="hero" onClick={() => navigate('/#pricing')}>
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">AI Employees</span>
                <span className="text-2xl">🤖</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.aiEmployees}
              </div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tasks Completed</span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.tasksCompleted}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Time Saved</span>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${metrics.timeSaved}h`}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cost Savings</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : `$${(metrics.costSavings / 1000).toFixed(1)}k`}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Team Integration Dashboard */}
        <div className="mb-8">
          <AITeamDashboard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="cursor-pointer hover:border-accent/50 transition-all duration-300 hover-scale">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{action.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {action.description}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={action.action}
                          disabled={action.requiresSubscription && !subscriptionStatus?.subscribed}
                        >
                          {action.requiresSubscription && !subscriptionStatus?.subscribed ? 'Requires Subscription' : 'Get Started'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;