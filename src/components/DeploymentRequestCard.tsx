import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface AIEmployee {
  id: string;
  name: string;
  role: string;
  type: string;
  description: string;
  skills: string[];
  avatar: string;
  color: string;
  icon: React.ReactNode;
  popular?: boolean;
}

interface DeploymentRequestCardProps {
  employee: AIEmployee;
}

export const DeploymentRequestCard: React.FC<DeploymentRequestCardProps> = ({ employee }) => {
  const { user, subscriptionStatus } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentNotes, setDeploymentNotes] = useState('');

  const handleDeploymentRequest = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to deploy AI employees.",
        variant: "destructive"
      });
      return;
    }

    if (!subscriptionStatus?.subscribed) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to deploy AI employees.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let businessProfile;
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingProfile) {
        businessProfile = existingProfile;
      } else {
        const { data: newProfile, error: createProfileError } = await supabase
          .from('business_profiles')
          .insert({
            user_id: user.id,
            name: `${user.email?.split('@')[0] || 'User'}'s Business`,
          })
          .select('id, name')
          .single();

        if (createProfileError) throw createProfileError;
        businessProfile = newProfile;
      }

      let templateId: string | null = null;
      const { data: existingTemplate } = await supabase
        .from('ai_helper_templates')
        .select('id')
        .eq('name', employee.name)
        .maybeSingle();

      if (existingTemplate) {
        templateId = existingTemplate.id;
      } else {
        const { data: newTemplate, error: createError } = await supabase
          .from('ai_helper_templates')
          .insert({
            name: employee.name,
            description: employee.description,
            category: employee.type,
            color_scheme: employee.color,
            prompt_template: `You are ${employee.name}, a ${employee.role}. ${employee.description}`,
            capabilities: employee.skills as any,
            user_id: user.id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        templateId = newTemplate!.id;
      }

      const { data: deploymentRequest, error: requestError } = await supabase
        .from('ai_employee_deployment_requests')
        .insert({
          user_id: user.id,
          helper_template_id: templateId,
          business_profile_id: businessProfile.id,
          deployment_config: {
            notes: deploymentNotes,
          },
        })
        .select('id')
        .single();

      if (requestError) throw requestError;

      if (subscriptionStatus.subscription_tier === 'Enterprise') {
        const { error: approvalError } = await supabase.functions.invoke('deploy-ai-employee', {
          body: { deployment_request_id: deploymentRequest!.id },
        });
        if (approvalError) {
          toast({ title: "Deployment Submitted", description: "Auto-approval failed, manual review required." });
        } else {
          toast({ title: "Employee Deployed!", description: `${employee.name} is now active.` });
        }
      } else {
        toast({ title: "Deployment Requested", description: "Your request has been submitted for review." });
      }

      setIsOpen(false);
      setDeploymentNotes('');

    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group border-2 border-slate-700/50 hover:border-primary/30 backdrop-blur-sm overflow-hidden bg-slate-800/50">
      <div className="relative">
        <div className="h-[300px] w-full bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden flex items-center justify-center p-4">
          <img 
            src={employee.avatar} 
            alt={`${employee.name} - AI Employee`}
            className="max-w-[80%] max-h-[90%] object-contain group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
          {employee.popular && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg animate-pulse">
              <CheckCircle className="w-3 h-3 mr-1 fill-current" />
              Elite
            </Badge>
          )}
          <div className="absolute bottom-3 left-3">
            <div className={`w-12 h-12 ${employee.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
              {employee.icon}
            </div>
          </div>
        </div>
      </div>
      
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {employee.name}
        </CardTitle>
        <CardDescription className="font-medium text-primary/80">
          {employee.role}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {employee.description}
        </p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-primary mb-2">Core Skills:</h4>
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{employee.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={!subscriptionStatus?.subscribed}
              >
                <Zap className="w-4 h-4 mr-2" />
                {subscriptionStatus?.subscribed ? 'Deploy Employee' : 'Upgrade Required'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${employee.color} rounded-full flex items-center justify-center text-white`}>
                    {employee.icon}
                  </div>
                  Deploy {employee.name}
                </DialogTitle>
                <DialogDescription>
                  Submit a deployment request for {employee.name} to join your AI team.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Deployment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific requirements or use cases for this employee..."
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Deployment Details
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Employee will be reviewed within 24 hours</li>
                    <li>• Deployment includes full integration with your business context</li>
                    <li>• Employee can be customized after deployment</li>
                    {subscriptionStatus?.subscription_tier === 'Enterprise' && (
                      <li>• ⚡ Enterprise: Instant deployment available</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeploymentRequest}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};