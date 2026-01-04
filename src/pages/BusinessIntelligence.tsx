import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/supabase';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  BarChart3, 
  Brain, 
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Lightbulb
} from 'lucide-react';
import { Header } from '@/components/Header';
import { JsonValue } from '@/types/json';

interface BusinessGoal {
  id: string;
  goal_name: string | null;
  title: string | null;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  goal_type: string | null;
  status: string;
  assigned_employees: string[];
  progress_history: unknown;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SharedKnowledge {
  id: string;
  knowledge_type: string | null;
  title: string | null;
  content: string;
  source_employee: string | null;
  relevance_tags: string[];
  confidence_score: number | null;
  is_verified: boolean | null;
  created_at: string;
  user_id: string;
  metadata: JsonValue | null;
}

const BusinessIntelligence = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [knowledge, setKnowledge] = useState<SharedKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    description: '',
    target_value: 0,
    unit: '',
    goal_type: 'revenue',
    deadline: '',
    priority: 'medium',
    assigned_employees: [] as string[]
  });

  const goalTypes = [
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'leads', label: 'Leads', icon: Users },
    { value: 'conversion', label: 'Conversion', icon: TrendingUp },
    { value: 'engagement', label: 'Engagement', icon: BarChart3 },
    { value: 'efficiency', label: 'Efficiency', icon: Target },
    { value: 'custom', label: 'Custom', icon: Brain }
  ];

  const statusColors = {
    active: 'default' as const,
    completed: 'secondary' as const,
    paused: 'outline' as const,
    cancelled: 'destructive' as const
  };

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching business intelligence data...');
      if (!user) return;
      await new Promise(resolve => setTimeout(resolve, 500));

      const [goalsResult, knowledgeResult] = await Promise.all([
        supabase
          .from('business_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ai_shared_knowledge')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const goalsData = (goalsResult.data || []) as BusinessGoal[];
      const knowledgeData = (knowledgeResult.data || []) as SharedKnowledge[];

      setGoals(goalsData);
      setKnowledge(knowledgeData);
    } catch (error) {
      console.error('❌ Error fetching BI data:', error);
      toast("Error", {
        description: 'Failed to fetch business intelligence data'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // Allow time for auth to initialize
      return;
    }
    fetchData();
  }, [user, fetchData]);

  const createGoal = async () => {
    try {
      if (!newGoal.goal_name.trim() || !user) {
        toast('Error', {
          description: 'Please enter a goal name'
        });
        return;
      }

      const { error } = await supabase
        .from('business_goals')
        .insert({
          ...newGoal,
          user_id: user.id,
          current_value: 0,
          status: 'active',
        });

      toast('Success', {
        description: 'Business goal created successfully'
      });

      setNewGoal({
        goal_name: '',
        description: '',
        target_value: 0,
        unit: '',
        goal_type: 'revenue',
        deadline: '',
        priority: 'medium',
        assigned_employees: []
      });
      setShowGoalDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast('Error', {
        description: 'Failed to create goal'
      });
    }
  };

  const getProgressPercentage = (current: number | null, target: number | null) => {
    if (target === 0 || target === null || current === null) return 0;
    return Math.min(100, (current / target) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getKnowledgeIcon = (type: string | null) => {
    if (!type) return <Brain className="w-4 h-4" />;
    switch (type) {
      case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'strategy': return <Target className="w-4 h-4 text-blue-500" />;
      case 'data': return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'lesson': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'template': return <Users className="w-4 h-4 text-orange-500" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading business intelligence...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Business Intelligence</h1>
              <p className="text-xl text-muted-foreground">
                Track goals, share insights, and drive growth with AI team intelligence
              </p>
            </div>
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Business Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Goal Name</label>
                      <Input
                        value={newGoal.goal_name}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, goal_name: e.target.value }))}
                        placeholder="e.g., Increase Monthly Revenue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={newGoal.description}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this goal in detail"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Target Value</label>
                        <Input
                          type="number"
                          value={newGoal.target_value}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: Number(e.target.value) }))}
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Unit</label>
                        <Input
                          value={newGoal.unit}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="USD, leads, %, etc."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Goal Type</label>
                        <select
                          value={newGoal.goal_type}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          {goalTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <select
                          value={newGoal.priority}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Deadline</label>
                      <Input
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createGoal} disabled={!newGoal.goal_name.trim()}>
                      Create Goal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Goals */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Business Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.map(goal => {
                    const progress = getProgressPercentage(goal.current_value, goal.target_value);
                    const goalType = goalTypes.find(t => t.value === goal.goal_type);
                    const IconComponent = goalType?.icon || Target;
                    
                    return (
                      <Card key={goal.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="w-4 h-4 text-primary" />
                            </div>
                             <div>
                               <h4 className="font-semibold">{goal.goal_name || goal.title || 'Untitled Goal'}</h4>
                               <p className="text-sm text-muted-foreground">{goal.description || 'No description'}</p>
                             </div>
                          </div>
                           <div className="flex items-center space-x-2">
                             {getStatusIcon(goal.status)}
                             <Badge variant={statusColors[goal.status as keyof typeof statusColors]}>
                               {goal.status}
                             </Badge>
                           </div>
                        </div>
                        
                         <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span>Progress</span>
                             <span>{(goal.current_value || 0).toLocaleString()} / {(goal.target_value || 0).toLocaleString()} {goal.unit || 'units'}</span>
                           </div>
                           <Progress value={progress} className="h-2" />
                           <div className="flex justify-between text-xs text-muted-foreground">
                             <span>{progress.toFixed(1)}% complete</span>
                             <span className="flex items-center">
                               <Calendar className="w-3 h-3 mr-1" />
                               {new Date(goal.created_at).toLocaleDateString()}
                             </span>
                           </div>
                         </div>

                        {goal.assigned_employees.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Assigned AI Employees:</p>
                            <div className="flex flex-wrap gap-1">
                              {goal.assigned_employees.map((employee, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {employee}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {goals.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No business goals set yet. Create your first goal to start tracking progress.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Team Knowledge Base */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Team Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {knowledge.map(item => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getKnowledgeIcon(item.knowledge_type)}
                          <span className="text-sm font-medium capitalize">{item.knowledge_type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {item.is_verified && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                           <Badge variant="outline" className="text-xs">
                             {((item.confidence_score || 0) * 100).toFixed(0)}%
                           </Badge>
                        </div>
                      </div>
                       <h4 className="font-medium text-sm mb-1">{item.title || 'Untitled'}</h4>
                       <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                         {item.content}
                       </p>
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <span>by {item.source_employee || 'Unknown'}</span>
                         <span>{new Date(item.created_at).toLocaleDateString()}</span>
                       </div>
                      {item.relevance_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.relevance_tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}

                  {knowledge.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No insights shared yet. Your AI employees will start sharing knowledge as they work.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;
