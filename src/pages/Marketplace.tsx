
import React from 'react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSubscriber, subscriptionStatus } = useAuth();
  const userTier = subscriptionStatus?.subscription_tier || 'free';

  const handleDeploy = (templateId: string, templateName: string, isPremium: boolean) => {
    if (!user) {
      toast.error('Please sign in to deploy AI employees');
      navigate('/auth');
      return;
    }
    if (!isSubscriber) {
      toast.error('Subscription required to deploy AI employees');
      navigate('/pricing');
      return;
    }
    if (isPremium && userTier !== 'enterprise') {
      toast.error('Enterprise subscription required for premium AI employees');
      navigate('/pricing');
      return;
    }
    navigate('/ai-employees');
  };

  const canDeploy = (isPremium: boolean) => {
    if (!isSubscriber) return false;
    if (isPremium && userTier !== 'enterprise') return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            All Included with Your Subscription
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Employee <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy powerful AI employees instantly. All employees are included with your Pro or Enterprise subscription.
          </p>
        </div>

        {/* Subscription Info Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-primary mb-1">🚀 Simple Pricing, Unlimited Value</h3>
              <p className="text-muted-foreground">No per-employee fees. Deploy as many AI employees as your plan allows.</p>
            </div>
            <div className="flex gap-6 text-center">
              <div className="bg-slate-800/50 rounded-lg px-6 py-3">
                <p className="text-2xl font-bold text-white">$39<span className="text-sm text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">Pro • 10 Employees</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg px-6 py-3 border border-purple-500/30">
                <p className="text-2xl font-bold text-white">$79<span className="text-sm text-muted-foreground">/mo</span></p>
                <p className="text-xs text-purple-400">Enterprise • Unlimited</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiEmployeeTemplates.map((template) => {
            const included = canDeploy(template.isPremium);
            
            return (
              <Card key={template.id} className={`bg-slate-800/50 border-slate-700/50 hover:border-primary/50 transition-all overflow-hidden ${!included && isSubscriber ? 'opacity-75' : ''}`}>
                {/* Included Banner */}
                <div className={`px-4 py-2 flex items-center justify-between ${template.isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-primary to-blue-600'}`}>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {template.isPremium ? 'Included with Enterprise' : 'Included with Pro & Enterprise'}
                  </span>
                  {template.isPremium && <Crown className="w-4 h-4 text-yellow-300" />}
                </div>
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${template.colorClass}`}>
                        <template.icon className="w-4 h-4 text-white" />
                      </span>
                      {template.name}
                    </span>
                    <Badge className={template.isPremium ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}>
                      {template.isPremium ? 'Premium' : 'Standard'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.skills.map((skill) => (
                        <span key={skill} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">Example Tasks:</h4>
                    <ul className="space-y-1">
                      {template.exampleTasks.slice(0, 2).map((task, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-primary">•</span> {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    onClick={() => handleDeploy(template.id, template.name, template.isPremium)} 
                    className={`w-full ${template.isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-primary to-blue-600'} hover:opacity-90`}
                    disabled={!user}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {!isSubscriber ? 'Subscribe to Deploy' : template.isPremium && userTier !== 'enterprise' ? 'Upgrade to Enterprise' : 'Deploy Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Ready to build your AI team?</h3>
            <p className="text-muted-foreground mb-6">
              Start with Pro at $39/mo and get access to 10 AI employees. Upgrade to Enterprise for unlimited deployments.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/pricing')}>View Plans</Button>
              <Button onClick={() => navigate('/ai-employees')} className="bg-gradient-to-r from-primary to-blue-600">
                {isSubscriber ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
