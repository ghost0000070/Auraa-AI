import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot, Rocket, Users, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { TemplateIcon } from './TemplateIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Employee {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'idle' | 'offline';
  template_id?: string;
  created_at?: string;
}

export const MyEmployees: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deployed_employees')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    const newStatus = employee.status === 'active' ? 'idle' : 'active';
    
    try {
      const { error } = await supabase
        .from('deployed_employees')
        .update({ status: newStatus })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      setEmployees(prev => prev.map(e => 
        e.id === employee.id ? { ...e, status: newStatus } : e
      ));
      toast.success(`${employee.name} is now ${newStatus}`);
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const removeEmployee = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('deployed_employees')
        .delete()
        .eq('id', employee.id);
      
      if (error) throw error;
      
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
      toast.success(`${employee.name} has been removed`);
    } catch (error) {
      console.error('Error removing employee:', error);
      toast.error('Failed to remove employee');
    }
  };

  const getTemplateInfo = (templateId?: string) => {
    if (!templateId) return null;
    return aiEmployeeTemplates.find(t => t.id === templateId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your employees...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-700/30 p-6 rounded-full mb-6">
            <Bot className="h-16 w-16 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Employees Hired Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Visit the Marketplace to hire AI employees that will automate your business tasks.
          </p>
          <Button onClick={() => navigate('/marketplace')} size="lg" className="gap-2">
            <Rocket className="h-5 w-5" />
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            My AI Employees
          </h2>
          <p className="text-muted-foreground">
            {employees.length} employee{employees.length !== 1 ? 's' : ''} hired
          </p>
        </div>
        <Button onClick={() => navigate('/marketplace')} variant="outline" className="gap-2">
          <Rocket className="h-4 w-4" />
          Hire More
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => {
          const template = getTemplateInfo(employee.template_id);
          
          return (
            <Card 
              key={employee.id} 
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/ai-employees/${employee.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {template ? (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: template.color }}
                      >
                        <TemplateIcon icon={template.icon} className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/20 text-primary text-lg">
                          {employee.name?.substring(0, 2).toUpperCase() || 'AI'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription>{employee.category}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(employee.status)} text-white`}>
                    {employee.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEmployeeStatus(employee);
                    }}
                    className="gap-1"
                  >
                    {employee.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {employee.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this AI employee from your team. 
                          Any scheduled tasks will be cancelled.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeEmployee(employee)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
