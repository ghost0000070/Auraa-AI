import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Target, Users, Globe, Sparkles } from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Real Estate',
  'Consulting',
  'Manufacturing',
  'Retail',
  'Food & Beverage',
  'Entertainment',
  'Travel & Hospitality',
  'Non-profit',
  'Other',
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    description: '',
    targetAudience: '',
    websiteUrl: '',
    goals: [] as string[],
  });
  const [goalInput, setGoalInput] = useState('');

  // Check if user already has a business profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        // Already has profile, redirect to dashboard
        navigate('/dashboard');
      }
    };
    
    checkProfile();
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGoal = () => {
    if (goalInput.trim() && formData.goals.length < 5) {
      setFormData(prev => ({ ...prev, goals: [...prev.goals, goalInput.trim()] }));
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!formData.businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    if (!formData.industry) {
      toast.error('Please select your industry');
      return;
    }
    if (!formData.targetAudience.trim()) {
      toast.error('Please describe your target audience');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_name: formData.businessName.trim(),
          industry: formData.industry,
          description: formData.description.trim() || null,
          target_audience: formData.targetAudience.trim(),
          website_url: formData.websiteUrl.trim() || null,
          goals: formData.goals.length > 0 ? formData.goals : null,
        });

      if (error) throw error;

      toast.success('Business profile created! Your AI employees are ready to work.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating business profile:', error);
      toast.error(error.message || 'Failed to create business profile');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        toast.error('Please enter your business name');
        return;
      }
      if (!formData.industry) {
        toast.error('Please select your industry');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your AI Workforce</CardTitle>
          <CardDescription className="text-base">
            Tell us about your business so your AI employees can work autonomously
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Acme Inc."
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Target Audience & Description */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Audience <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Describe your ideal customers... (e.g., Small business owners aged 25-45 who need help with marketing)"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Business Description <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="What does your business do? What problems do you solve?"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Business Goals <span className="text-muted-foreground text-sm">(optional, up to 5)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  What are you trying to achieve? Your AI employees will work toward these goals.
                </p>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Increase sales by 20%"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                    disabled={formData.goals.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGoal}
                    disabled={formData.goals.length >= 5 || !goalInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {formData.goals.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {formData.goals.map((goal, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <span className="text-sm">{goal}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ready to go!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Once you complete setup, your AI employees will start working autonomously every 5 minutes, 
                  researching opportunities, generating insights, and taking actions to help your business grow.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="min-w-[140px]"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
