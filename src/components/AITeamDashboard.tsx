import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, Code, ChevronDown, ChevronUp, AlertCircle, ArrowRight, CheckCircle, Clock, MessageSquare, Loader2, Rocket, Bot, TrendingUp, Plus
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AgentTask {
  id: string;
  action: string;
  status: 'success' | 'running' | 'queued' | 'error' | 'completed' | 'pending' | 'failed';
  parameters: { url?: string; [key: string]: unknown; };
  result?: unknown;
  error?: string;
  finished_at?: string;
  started_at?: string;
  created_at?: string;
}

interface Communication {
  id: string;
  sender_employee: string;
  recipient_employee: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

interface Employee {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'idle' | 'offline';
  template_id?: string;
  created_at?: string;
}

interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  successRate: number;
  avgResponseTime: number;
  tasksToday: number;
  activeEmployees: number;
}

interface MetricCard {
  id: string;
  name: string;
  value: string | number;
  helper?: string;
  timestamp?: string;
  trend?: 'up' | 'down';
}

const AITeamDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: agentMetrics, isLoading: metricsLoading } = useAgentMetrics();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    tasks: true, comms: true, employees: true
  });
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    steps: [] as string[]
  });
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  const handleLoading = (section: string, status: boolean) => {
    setLoading(prev => ({...prev, [section]: status}));
  }
  
  const allDataLoaded = Object.values(loading).every(v => !v) && !metricsLoading;

  // Calculate real performance metrics from tasks
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'success').length;
    const failed = tasks.filter(t => t.status === 'failed' || t.status === 'error').length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'queued').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const total = tasks.length;
    
    // Calculate success rate (excluding pending/running)
    const finishedTasks = completed + failed;
    const successRate = finishedTasks > 0 ? Math.round((completed / finishedTasks) * 100) : 100;
    
    // Calculate average response time from completed tasks
    const completedWithTime = tasks.filter(t => 
      (t.status === 'completed' || t.status === 'success') && t.started_at && t.finished_at
    );
    
    let avgResponseTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, t) => {
        const start = new Date(t.started_at!).getTime();
        const end = new Date(t.finished_at!).getTime();
        return sum + (end - start);
      }, 0);
      avgResponseTime = Math.round(totalTime / completedWithTime.length / 1000); // in seconds
    }
    
    // Calculate tasks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksToday = tasks.filter(t => {
      if (!t.created_at) return false;
      const taskDate = new Date(t.created_at);
      return taskDate >= today;
    }).length;
    
    // Count active employees
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    
    return {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      pendingTasks: pending,
      runningTasks: running,
      successRate,
      avgResponseTime,
      tasksToday,
      activeEmployees
    };
  }, [tasks, employees]);

  const metricCards: MetricCard[] = useMemo(() => {
    const successRate = agentMetrics?.successRate ?? performanceMetrics.successRate;
    const avgResponseTime = agentMetrics?.avgResponseTime ?? performanceMetrics.avgResponseTime;

    return [
      {
        id: 'total-tasks',
        name: 'Total Tasks',
        value: agentMetrics?.totalTasks ?? performanceMetrics.totalTasks,
        helper: 'All-time volume',
        trend: 'up'
      },
      {
        id: 'success-rate',
        name: 'Success Rate',
        value: `${Math.round(successRate)}%`,
        helper: 'Completed vs failed',
        trend: successRate < 70 ? 'down' : 'up'
      },
      {
        id: 'avg-response',
        name: 'Avg Response Time',
        value: avgResponseTime ? `${Math.round(avgResponseTime)}s` : '—',
        helper: 'Completed tasks',
        trend: 'up'
      },
      {
        id: 'tasks-today',
        name: 'Tasks Today',
        value: performanceMetrics.tasksToday,
        helper: 'Since midnight',
        trend: 'up'
      },
      {
        id: 'failed-tasks',
        name: 'Failed Tasks',
        value: performanceMetrics.failedTasks,
        helper: 'Across all tasks',
        trend: performanceMetrics.failedTasks > 0 ? 'down' : 'up'
      },
      {
        id: 'active-employees',
        name: 'Active Employees',
        value: performanceMetrics.activeEmployees,
        helper: 'Currently online',
        trend: 'up'
      }
    ];
  }, [agentMetrics, performanceMetrics]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load tasks
        handleLoading('tasks', true);
        const { data: tasksData } = await supabase
          .from('agent_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (tasksData) setTasks(tasksData as AgentTask[]);
        handleLoading('tasks', false);

        // Load communications
        handleLoading('comms', true);
        const { data: commsData } = await supabase
          .from('ai_team_communications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (commsData) {
          setCommunications(commsData as Communication[]);
          // Handle unread messages
          const unreadComms = commsData.filter((c: Communication) => !c.is_read);
          for (const comm of unreadComms) {
            toast(`New Message from ${comm.sender_employee}`, { description: comm.content });
          }
          // Mark as read
          if (unreadComms.length > 0) {
            await supabase
              .from('ai_team_communications')
              .update({ is_read: true })
              .in('id', unreadComms.map((c: Communication) => c.id));
          }
        }
        handleLoading('comms', false);

        // Load deployed employees
        handleLoading('employees', true);
        const { data: employeesData, error: employeesError } = await supabase
          .from('deployed_employees')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (employeesError) {
          console.error('Error loading employees:', employeesError);
        }
        if (employeesData) setEmployees(employeesData as Employee[]);
        handleLoading('employees', false);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        Object.keys(loading).forEach(key => handleLoading(key, false));
      }
    };

    loadData();

    // Subscribe to real-time updates
    const tasksChannel = supabase
      .channel('tasks_rt')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as AgentTask, ...prev].slice(0, 50));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as AgentTask : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const commsChannel = supabase
      .channel('comms_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ai_team_communications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComm = payload.new as Communication;
            setCommunications(prev => [newComm, ...prev].slice(0, 20));
            if (!newComm.is_read) {
              toast(`New Message from ${newComm.sender_employee}`, { description: newComm.content });
              supabase.from('ai_team_communications')
                .update({ is_read: true })
                .eq('id', newComm.id)
                .then(({ error }) => {
                  if (error) console.error('Failed to mark message as read:', error);
                });
            }
          } else if (payload.eventType === 'UPDATE') {
            setCommunications(prev => prev.map(c => c.id === payload.new.id ? payload.new as Communication : c));
          }
        }
      )
      .subscribe();

    const employeesChannel = supabase
      .channel('employees_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deployed_employees', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmployees(prev => [payload.new as Employee, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new as Employee : e));
          } else if (payload.eventType === 'DELETE') {
            setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      tasksChannel.unsubscribe();
      commsChannel.unsubscribe();
      employeesChannel.unsubscribe();
    };
  }, [user]);

  // Render helpers and constants
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-500', active: 'bg-green-500',
      running: 'bg-blue-500', idle: 'bg-blue-500',
      queued: 'bg-yellow-500',
      error: 'bg-red-500', offline: 'bg-red-500',
      default: 'bg-muted-foreground'
    }
    return colors[status] || colors.default;
  };
  
  const createWorkflow = async () => {
    if (!user || !workflowForm.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsCreatingWorkflow(true);
    try {
      const { error } = await supabase
        .from('ai_team_executions')
        .insert({
          user_id: user.id,
          workflow_name: workflowForm.name,
          status: 'pending',
          steps: workflowForm.steps.filter(step => step.trim()),
          results: null,
          started_at: null,
          completed_at: null
        });

      if (error) throw error;

      toast.success('Workflow created successfully!');
      setShowWorkflowDialog(false);
      setWorkflowForm({ name: '', description: '', steps: [] });
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  const addWorkflowStep = () => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const updateWorkflowStep = (index: number, value: string) => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  const removeWorkflowStep = (index: number) => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };
  
  const getIconForAction = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      'scrape_dashboard': <Activity className="h-5 w-5 mr-2" />,
      'login_and_scrape': <Activity className="h-5 w-5 mr-2" />
    }
    return icons[action] || <Code className="h-5 w-5 mr-2" />;
  }

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;

  if (!allDataLoaded) {
      return (
          <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading dashboard data...</p>
          </div>
      );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>{performanceMetrics.activeEmployees} active employee{performanceMetrics.activeEmployees !== 1 ? 's' : ''} in your AI workforce</CardDescription>
            </div>
            <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Workflow Name</label>
                    <Input
                      value={workflowForm.name}
                      onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <Textarea
                      value={workflowForm.description}
                      onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this workflow does"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Workflow Steps</label>
                      <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Step
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {workflowForm.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                          <Input
                            value={step}
                            onChange={(e) => updateWorkflowStep(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeWorkflowStep(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      {workflowForm.steps.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No steps added yet. Click "Add Step" to get started.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createWorkflow} disabled={isCreatingWorkflow || !workflowForm.name.trim()}>
                      {isCreatingWorkflow ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Workflow
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading.employees ? <p>Loading employees...</p> : employees.length === 0 ? (
                 <div className="col-span-2 flex flex-col items-center justify-center py-12">
                    <div className="bg-slate-700/30 p-4 rounded-full mb-4">
                      <Bot className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No AI Employees Deployed Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      Deploy your first AI employee to start automating tasks and boosting productivity.
                    </p>
                    <Button onClick={() => navigate('/marketplace')} className="gap-2">
                      <Rocket className="h-4 w-4" />
                      Deploy Your First AI Employee
                    </Button>
                 </div>
            ) : (
                employees.map(employee => (
                    <div 
                      key={employee.id} 
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => navigate(`/ai-employees/${employee.id}`)}
                    >
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarFallback className="bg-primary/20 text-primary">{employee.name?.substring(0,2).toUpperCase() || 'AI'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">{employee.category}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <Badge className={`${getStatusColor(employee.status)} text-white mb-1`}>
                                {employee.status}
                            </Badge>
                        </div>
                    </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
            {loading.tasks ? <p>Loading tasks...</p> : totalTasks === 0 ? <p className='text-center text-muted-foreground'>No tasks yet.</p> : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Success</span>
                        <span>{taskStatusCounts['success'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['success'] || 0) / totalTasks * 100} className="h-2" />
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500"/> Running</span>
                        <span>{taskStatusCounts['running'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['running'] || 0) / totalTasks * 100} className="h-2" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500"/> Queued</span>
                        <span>{taskStatusCounts['queued'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['queued'] || 0) / totalTasks * 100} className="h-2" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500"/> Failed</span>
                        <span>{taskStatusCounts['error'] || 0}</span>
                    </div>
                    <Progress value={(taskStatusCounts['error'] || 0) / totalTasks * 100} className="h-2" />
                </div>
            )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI Agent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {loading.tasks ? <p>Loading tasks...</p> : tasks.length === 0 ? (
                 <div className="text-center text-muted-foreground py-8">No tasks recorded yet.</div>
            ) : (
                tasks.map((task) => (
                <Collapsible key={task.id} open={expandedTask === task.id} onOpenChange={() => toggleExpand(task.id)}>
                    <Card className="w-full">
                        <CollapsibleTrigger asChild>
                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center">
                                    {getIconForAction(task.action)}
                                    <span className="font-semibold">{task.action?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                        {task.created_at ? new Date(task.created_at).toLocaleString() : ''}
                                    </span>
                                    <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                                    <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
                                    {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-4 border-t border-border bg-secondary/30">
                                <p className="mb-2"><strong>ID:</strong> <span className="text-xs font-mono">{task.id}</span></p>
                                {task.parameters?.url && <p className="mb-2"><strong>Target:</strong> <a href={task.parameters.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{task.parameters.url}</a></p>}
                                
                                  {task.result !== undefined && task.result !== null && (
                                    <div className="mt-2">
                                        <strong>Result:</strong>
                                        <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-60">
                                            {JSON.stringify(task.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {task.error && typeof task.error === 'string' && (
                                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
                                        <strong>Error:</strong> {task.error}
                                    </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    Finished: {task.finished_at ? new Date(task.finished_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
                ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Communications</CardTitle>
          <CardDescription>Real-time agent interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {loading.comms ? <p>Loading communications...</p> : communications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20"/>
                    <p>No communications yet.</p>
                </div>
            ) : (
                communications.map((comm) => (
                <div key={comm.id} className="p-3 bg-card border border-border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-1">
                        <span className="font-bold text-xs text-primary">
                            {comm.sender_employee === 'User' ? 'You' : comm.sender_employee} 
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground"/>
                        <span className="font-bold text-xs text-primary">
                            {comm.recipient_employee === 'User' ? 'You' : comm.recipient_employee}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {comm.created_at ? formatDistanceToNow(new Date(comm.created_at), { addSuffix: true }) : ''}
                    </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug">{comm.content}</p>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metricsLoading ? (
                <p>Loading metrics...</p>
              ) : (
                metricCards.map(metric => (
                  <Card key={metric.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-medium truncate" title={metric.name}>{metric.name}</CardTitle>
                        {metric.helper && (
                          <p className="text-xs text-muted-foreground">{metric.helper}</p>
                        )}
                      </div>
                      {metric.trend === 'down' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      {metric.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITeamDashboard;
