import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Clock, Play, Pause, Trash2, ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ScheduledTask {
  id: string;
  name: string;
  employee_id: string;
  employee_name?: string;
  action: string;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
}

const cronPresets = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9am', value: '0 9 * * *' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'Every month on 1st', value: '0 0 1 * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
];

const AgentScheduling: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [taskName, setTaskName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [action, setAction] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch scheduled tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('scheduled_tasks')
        .select('*, deployed_employees(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch employees for dropdown
      const { data: employeesData, error: employeesError } = await supabase
        .from('deployed_employees')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      setTasks(
        tasksData?.map(t => ({
          ...t,
          employee_name: t.deployed_employees?.name,
        })) || []
      );
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!user || !taskName.trim() || !selectedEmployee || !action.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert({
          user_id: user.id,
          employee_id: selectedEmployee,
          name: taskName.trim(),
          action: action.trim(),
          cron_expression: cronExpression,
          is_active: true,
        })
        .select('*, deployed_employees(name)')
        .single();

      if (error) throw error;

      setTasks(prev => [{ ...data, employee_name: data.deployed_employees?.name }, ...prev]);
      setCreateDialogOpen(false);
      resetForm();
      toast.success('Scheduled task created');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create scheduled task');
    } finally {
      setCreating(false);
    }
  };

  const toggleTask = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTasks(prev => prev.map(t => (t.id === id ? { ...t, is_active: isActive } : t)));
      toast.success(isActive ? 'Task enabled' : 'Task paused');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Scheduled task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const resetForm = () => {
    setTaskName('');
    setSelectedEmployee('');
    setAction('');
    setCronExpression('0 9 * * *');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Agent Scheduling
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={employees.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Schedule New Task</DialogTitle>
                  <DialogDescription>
                    Set up a recurring task for one of your AI employees.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Task Name</Label>
                    <Input
                      placeholder="e.g. Daily Report Generation"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>AI Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Input
                      placeholder="e.g. generate_report, scrape_data"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select value={cronExpression} onValueChange={setCronExpression}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cronPresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Cron: <code className="text-primary">{cronExpression}</code>
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createTask}
                    disabled={!taskName.trim() || !selectedEmployee || !action.trim() || creating}
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {employees.length === 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="pt-6">
              <p className="text-yellow-300 text-sm">
                You need to deploy at least one AI employee before you can schedule tasks.
              </p>
              <Button variant="link" className="text-yellow-400 p-0 mt-2" onClick={() => navigate('/marketplace')}>
                Deploy an AI Employee →
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled Tasks
            </CardTitle>
            <CardDescription>
              Automate recurring tasks with your AI employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No scheduled tasks yet</p>
                <p className="text-sm mt-1">Create your first scheduled task to automate recurring work</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{task.name}</span>
                          <Badge
                            variant="outline"
                            className={
                              task.is_active
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }
                          >
                            {task.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Employee: {task.employee_name || 'Unknown'}</p>
                          <p>Action: <code className="text-primary">{task.action}</code></p>
                          <p>
                            Schedule: <code className="text-xs">{task.cron_expression}</code>
                          </p>
                          {task.last_run_at && (
                            <p>
                              Last run: {formatDistanceToNow(new Date(task.last_run_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTask(task.id, !task.is_active)}
                        >
                          {task.is_active ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgentScheduling;
