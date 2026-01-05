import React, { useState, useEffect } from 'react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, Zap, Crown, Sparkles, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';

interface EmployeeSubscription {
  employee_template_id: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSubscriber } = useAuth();
  const [employeeSubs, setEmployeeSubs] = useState<EmployeeSubscription[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [introEndsAt, setIntroEndsAt] = useState<Date | null>(null);
  
  const isInIntro = isSubscriber && introEndsAt && new Date() < introEndsAt;

  // Fetch user's employee subscriptions
  useEffect(() => {
    if (!user) return;
    
    const fetchSubs = async () => {
      // Get employee subscriptions
      const { data: subs } = await supabase
        .from('employee_subscriptions')
        .select('employee_template_id, status, is_trial, trial_ends_at')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (subs) setEmployeeSubs(subs);
      
      // Get intro subscription end date
      const { data: userData } = await supabase
        .from('users')
        .select('intro_subscription_ends_at')
        .eq('id', user.id)
        .single();
      
      if (userData?.intro_subscription_ends_at) {
        setIntroEndsAt(new Date(userData.intro_subscription_ends_at));
      }
    };
    
    fetchSubs();
  }, [user]);

  const hasEmployeeAccess = (templateId: string) => {
    // During intro period, all employees are accessible
    if (isInIntro) return true;
    // Otherwise, check for individual subscription
    return employeeSubs.some(s => s.employee_template_id === templateId && s.status === 'active');
  };

  const handleSubscribeToEmployee = async (templateId: string, templateName: string, price: number) => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }
    
    setLoading(templateId);
    
    try {
      const { data, error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'create-employee-checkout',
          employeeTemplateId: templateId,
          employeeName: templateName,
          employeePrice: price,
          successUrl: `${window.location.origin}/marketplace?subscribed=${templateId}`,
          cancelUrl: `${window.location.origin}/marketplace`,
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error((error as Error).message || 'Could not create checkout session');
    } finally {
      setLoading(null);
    }
  };

  const handleDeploy = (templateId: string) => {
    if (!hasEmployeeAccess(templateId)) {
      toast.error('Please subscribe to this AI employee first');
      return;
    }
    navigate('/ai-employees');
  };

  const daysUntilIntroEnds = introEndsAt 
    ? Math.max(0, Math.ceil((introEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Employee Subscriptions
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Employee <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Subscribe to individual AI employees. Each employee is billed monthly at its listed price.
          </p>
        </div>

        {/* Intro Subscription Banner - For Non-Subscribers */}
        {!isSubscriber && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-1">🎉 New Customer Special!</h3>
                <p className="text-muted-foreground">
                  Start with Pro ($39) or Enterprise ($79) for <strong>30 days access to ALL employees</strong>. 
                  After 30 days, subscribe to the employees you want to keep at their listed prices.
                </p>
              </div>
              <Button onClick={() => navigate('/pricing')} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                Get 30-Day Access
              </Button>
            </div>
          </div>
        )}

        {/* Active Intro Period Banner */}
        {isInIntro && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-xl font-bold text-blue-400">Intro Period Active</h3>
                  <p className="text-muted-foreground">
                    You have access to ALL employees for <strong>{daysUntilIntroEnds} more days</strong>. 
                    Subscribe to your favorites before it ends to keep using them!
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-4 py-2">
                {daysUntilIntroEnds} days left
              </Badge>
            </div>
          </div>
        )}

        {/* Post-Intro Banner */}
        {isSubscriber && !isInIntro && employeeSubs.length === 0 && (
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-orange-400 mb-1">⚡ Your intro period has ended</h3>
                <p className="text-muted-foreground">
                  Subscribe to individual AI employees below to continue using them. Each has its own monthly price.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiEmployeeTemplates.map((template) => {
            const hasAccess = hasEmployeeAccess(template.id);
            const isSubscribed = employeeSubs.some(s => s.employee_template_id === template.id);
            
            return (
              <Card key={template.id} className="bg-slate-800/50 border-slate-700/50 hover:border-primary/50 transition-all overflow-hidden">
                {/* Status Banner */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  isSubscribed ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
                  hasAccess ? 'bg-gradient-to-r from-blue-600 to-purple-600' :
                  template.isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 
                  'bg-gradient-to-r from-slate-600 to-slate-700'
                }`}>
                  <span className="text-sm font-medium text-white flex items-center gap-1">
                    {isSubscribed ? (
                      <><Check className="w-4 h-4" /> Subscribed</>
                    ) : hasAccess ? (
                      <><Clock className="w-4 h-4" /> Intro Access</>
                    ) : (
                      <>${template.monthlyCost}/month</>
                    )}
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

                  {/* Pricing */}
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly subscription:</span>
                      <span className="text-2xl font-bold text-white">${template.monthlyCost}<span className="text-sm text-muted-foreground">/mo</span></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isSubscribed ? (
                    <Button 
                      onClick={() => handleDeploy(template.id)} 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy Now
                    </Button>
                  ) : hasAccess ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleDeploy(template.id)} 
                        className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Deploy (Intro Access)
                      </Button>
                      <Button 
                        onClick={() => handleSubscribeToEmployee(template.id, template.name, template.monthlyCost)} 
                        variant="outline"
                        className="w-full"
                        disabled={loading === template.id}
                      >
                        {loading === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Subscribe for $${template.monthlyCost}/mo`}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (!user) {
                          navigate('/auth');
                        } else if (!isSubscriber) {
                          navigate('/pricing');
                        } else {
                          handleSubscribeToEmployee(template.id, template.name, template.monthlyCost);
                        }
                      }} 
                      className={`w-full ${template.isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-primary to-blue-600'} hover:opacity-90`}
                      disabled={loading === template.id}
                    >
                      {loading === template.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !user ? (
                        'Sign In to Subscribe'
                      ) : !isSubscriber ? (
                        'Start with Intro Offer'
                      ) : (
                        `Subscribe - $${template.monthlyCost}/mo`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">New to Auraa AI?</h3>
            <p className="text-muted-foreground mb-6">
              Start with our intro offer: Pro ($39) or Enterprise ($79) for 30 days of unlimited access. 
              Try all employees, then subscribe to the ones you love!
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/pricing')}>View Intro Offers</Button>
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
