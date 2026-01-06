import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/ChatInterface';
import { ArrowLeft, Star, Settings, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates.tsx';
import { TemplateIcon } from '@/components/TemplateIcon';

// Define a more specific type for the deployed employee
interface DeployedEmployee {
  id: string;
  name: string;
  configuration: Record<string, unknown>;
  template_id: string; // Storing the template ID is more robust
  user_id: string;
}

const AIEmployeePage: React.FC = () => {
  const { id: employeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deployedEmployee, setDeployedEmployee] = useState<DeployedEmployee | null>(null);
  const [staticData, setStaticData] = useState<(typeof aiEmployeeTemplates)[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!employeeId) {
        navigate('/ai-employees');
        return;
    }

    const fetchEmployee = async () => {
      setIsLoading(true);
      try {
        const { data: employeeData, error } = await supabase
          .from('deployed_employees')
          .select('*')
          .eq('id', employeeId)
          .single();

        if (error || !employeeData) {
          toast.error("Error", { description: "Could not find the specified AI employee." });
          navigate('/ai-employees');
          return;
        }
        
        if (employeeData.user_id !== user.id) {
            toast.error("Access Denied", { description: "You do not have permission to view this employee." });
            navigate('/ai-employees');
            return;
        }

        setDeployedEmployee(employeeData as DeployedEmployee);

        const staticInfo = aiEmployeeTemplates.find(e => e.id === employeeData.template_id);
        if (staticInfo) {
          setStaticData(staticInfo);
        }

        setConfigDraft(JSON.stringify(employeeData.configuration || {}, null, 2));
      } catch (error) {
        console.error("Error fetching employee:", error);
        toast.error("Error", { description: "Failed to fetch AI employee data." });
        navigate('/ai-employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, user, navigate]);

  const handleSaveSettings = async () => {
    if (!deployedEmployee) return;
    setIsSaving(true);
    try {
      const parsedConfig = JSON.parse(configDraft); // Validate JSON
      
      const { error } = await supabase
        .from('deployed_employees')
        .update({ configuration: parsedConfig })
        .eq('id', deployedEmployee.id);

      if (error) {
        throw error;
      }

      setDeployedEmployee(prev => prev ? { ...prev, configuration: parsedConfig } : null);
      toast.success("Configuration saved successfully.");
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Error saving config:", error);
      if (error instanceof SyntaxError) {
        toast.error("The configuration is not valid JSON.");
      } else {
        toast.error("Failed to save configuration.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !deployedEmployee || !staticData) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Button variant="ghost" onClick={() => setShowChat(false)} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to {deployedEmployee.name}
        </Button>
        <ChatInterface
          employeeType={staticData.id}
          employeeName={deployedEmployee.name}
          businessContext={JSON.stringify(deployedEmployee.configuration || {})}
          onClose={() => setShowChat(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ai-employees')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Power Guardians
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex justify-center">
             <div className="relative w-96 h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden shadow-2xl">
                <img src={staticData.image} alt={deployedEmployee.name} className="w-full h-full object-cover"/>
                {staticData.isPremium && <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" />Elite</div>}
                <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: staticData.color }}>
                  <TemplateIcon icon={staticData.icon} className="w-6 h-6" />
                </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">{deployedEmployee.name}</h1>
              <p className="text-xl text-primary/80 font-medium mb-4">{staticData.category}</p>
              <p className="text-muted-foreground leading-relaxed">{staticData.description}</p>
            </div>

            <Card className="bg-slate-800/50 border border-slate-700/50">
              <CardHeader><CardTitle className="text-primary">Advanced Protocols</CardTitle></CardHeader>
              <CardContent><div className="grid grid-cols-2 gap-2">{staticData.skills.map(skill => <div key={skill} className="bg-slate-700/50 px-3 py-2 rounded text-sm text-center">{skill}</div>)}</div></CardContent>
            </Card>

            <div className="flex items-center gap-4">
              <Button onClick={() => setShowChat(true)} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold shadow-lg" size="lg"><MessageCircle className="w-5 h-5 mr-2" />Activate {deployedEmployee.name}</Button>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild><Button variant="outline" size="lg"><Settings className="w-5 h-5" /></Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Configuration</DialogTitle><DialogDescription>Edit the JSON configuration for this AI Employee.</DialogDescription></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="config">Deployment Config</Label>
                    <Textarea id="config" value={configDraft} onChange={(e) => setConfigDraft(e.target.value)} className="min-h-[250px] font-mono text-xs" />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSettings} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIEmployeePage;
