import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/ChatInterface';
import { ArrowLeft, Star, Settings, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';

interface DeployedEmployee {
  id: string;
  name: string;
  deployment_config: Record<string, any>;
  ai_helper_templates: {
    name: string;
    description: string;
  };
}

const AIEmployeePage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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
      const { data, error } = await supabase
        .from('ai_employees')
        .select(`
          id,
          name,
          deployment_config,
          ai_helper_templates ( name, description )
        `)
        .eq('id', employeeId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({ title: "Error", description: "Could not find the specified AI employee.", variant: "destructive" });
        navigate('/ai-employees');
        return;
      }
      
      setDeployedEmployee(data as DeployedEmployee);

      const templateName = (data.ai_helper_templates as { name: string }).name;
      const staticInfo = aiEmployeeTemplates.find(e => e.name === templateName);
      
      if (staticInfo) {
        setStaticData(staticInfo);
      }

      setConfigDraft(JSON.stringify(data.deployment_config, null, 2));
      setIsLoading(false);
    };

    fetchEmployee();
  }, [employeeId, user, navigate, toast]);

  const handleSaveSettings = async () => {
    if (!deployedEmployee) return;
    setIsSaving(true);
    try {
      JSON.parse(configDraft); // Validate JSON
      const { error } = await supabase
        .from('ai_employees')
        .update({ deployment_config: JSON.parse(configDraft) })
        .eq('id', deployedEmployee.id);

      if (error) throw error;

      setDeployedEmployee(prev => prev ? { ...prev, deployment_config: JSON.parse(configDraft) } : null);
      toast({ title: "Success", description: "Configuration saved successfully." });
      setIsSettingsOpen(false);
    } catch (error: any) {
      toast({ title: "Invalid JSON", description: "The configuration is not valid JSON.", variant: "destructive" });
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
          employeeType={staticData.type}
          employeeName={deployedEmployee.name}
          businessContext={JSON.stringify(deployedEmployee.deployment_config)}
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
                <img src={staticData.avatar} alt={deployedEmployee.name} className="w-full h-full object-cover"/>
                {staticData.popular && <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" />Elite</div>}
                <div className={`absolute bottom-4 left-4 w-12 h-12 ${staticData.color} rounded-full flex items-center justify-center text-white shadow-lg`}>{staticData.icon}</div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">{deployedEmployee.name}</h1>
              <p className="text-xl text-primary/80 font-medium mb-4">{staticData.role}</p>
              <p className="text-muted-foreground leading-relaxed">{(deployedEmployee.ai_helper_templates as any).description}</p>
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