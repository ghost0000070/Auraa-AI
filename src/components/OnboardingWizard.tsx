import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Rocket, Building2, Target, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Auraa AI',
    description: 'Let\'s set up your AI workforce in just a few steps.',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 2,
    title: 'Tell us about your business',
    description: 'This helps us customize your AI employees for your industry.',
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    id: 3,
    title: 'Set your goals',
    description: 'What do you want to achieve with AI automation?',
    icon: <Target className="w-8 h-8" />,
  },
  {
    id: 4,
    title: 'Deploy your first AI employee',
    description: 'Choose a template to get started immediately.',
    icon: <Rocket className="w-8 h-8" />,
  },
];

const goals = [
  'Automate repetitive tasks',
  'Improve customer support',
  'Generate content faster',
  'Analyze data and insights',
  'Manage social media',
  'Lead generation',
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (data && !data.onboarding_completed) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save business profile
      const { error: profileError } = await supabase.from('business_profiles').upsert({
        user_id: user.id,
        business_name: businessName,
        industry: industry,
        goals: selectedGoals,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        throw profileError;
      }

      // Mark onboarding as complete
      const { error: userError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (userError) {
        throw userError;
      }

      toast.success('Welcome aboard! Your AI workforce is ready.');
      setOpen(false);
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3 text-primary mb-2">
            {steps[currentStep - 1].icon}
          </div>
          <DialogTitle className="text-xl text-white">
            {steps[currentStep - 1].title}
          </DialogTitle>
          <DialogDescription>
            {steps[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1 mb-4" />

        <div className="py-4">
          {currentStep === 1 && (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-lg">
                <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">
                  Auraa AI helps you deploy autonomous AI employees that handle tasks,
                  automate workflows, and boost your productivity.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-muted-foreground">AI Templates</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-muted-foreground">Automation</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">∞</div>
                  <div className="text-muted-foreground">Scalability</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Acme Inc."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. E-commerce, SaaS, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the goals you want to achieve (select all that apply):
              </p>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <Button
                    key={goal}
                    variant={selectedGoals.includes(goal) ? 'default' : 'outline'}
                    className={`justify-start h-auto py-3 ${
                      selectedGoals.includes(goal)
                        ? 'bg-primary text-white'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                    onClick={() => toggleGoal(goal)}
                  >
                    {selectedGoals.includes(goal) && (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm">{goal}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg">
                <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  You're all set!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Click finish to access your dashboard and deploy your first AI employee.
                </p>
              </div>
              {businessName && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Your business:</p>
                    <p className="font-semibold text-white">{businessName}</p>
                    {industry && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Industry: {industry}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Finishing...' : 'Finish Setup'}
              <Rocket className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
