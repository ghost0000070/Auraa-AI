import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Header } from "@/components/Header";
import { JsonValue } from '@/types/json';

interface BusinessProfile {
  id?: string;
  name: string;
  description: string;
  industry: string;
  target_audience: string;
  website_url: string;
  brand_voice: string;
  business_data: JsonValue;
  is_default: boolean;
}

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing",
  "Real Estate", "Consulting", "Marketing", "Legal", "Non-profit", "Other"
];

const brandVoices = [
  "Professional", "Friendly", "Authoritative", "Casual", "Innovative", 
  "Trustworthy", "Energetic", "Sophisticated", "Approachable", "Bold"
];

const BusinessProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    description: '',
    industry: '',
    target_audience: '',
    website_url: '',
    brand_voice: '',
    business_data: {},
    is_default: true
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchBusinessProfile();
    trackPageView();
  }, [user]);

  const trackPageView = async () => {
    try {
      await supabase.from('user_analytics').insert({
        event_type: 'page_view',
        page_path: '/business-profile',
        event_data: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          industry: data.industry || '',
          target_audience: data.target_audience || '',
          website_url: data.website_url || '',
          brand_voice: data.brand_voice || '',
          business_data: data.business_data || {},
          is_default: data.is_default || true
        });
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      toast({
        title: "Error",
        description: "Failed to load business profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'industry', 'target_audience'];
    const missingFields = requiredFields.filter(field => !profile[field as keyof BusinessProfile]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Track save attempt
      await supabase.from('user_analytics').insert({
        event_type: 'action_click',
        event_data: { 
          action: 'save_business_profile',
          has_existing_profile: !!profile.id
        }
      });

      const profileData = {
        user_id: user!.id,
        name: profile.name,
        description: profile.description,
        industry: profile.industry,
        target_audience: profile.target_audience,
        website_url: profile.website_url,
        brand_voice: profile.brand_voice,
        business_data: {
          ...(profile.business_data as object),
          updated_at: new Date().toISOString()
        },
        is_default: profile.is_default,
        is_active: true
      };

      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('business_profiles')
          .update(profileData)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('business_profiles')
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;
        setProfile(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Profile Saved",
        description: "Your business profile has been saved successfully.",
      });

      // Redirect back to dashboard or previous page
      navigate('/dashboard');

    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save business profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">Loading business profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24 max-w-2xl">
        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Complete your business profile to enable AI employees and get personalized recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your company name"
                className="bg-slate-900/60 border-slate-700 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Industry <span className="text-red-500">*</span>
              </label>
              <Select
                value={profile.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-foreground">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Company Description
              </label>
              <Textarea
                value={profile.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company and what you do"
                rows={4}
                className="bg-slate-900/60 border-slate-700 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={profile.target_audience}
                onChange={(e) => handleInputChange('target_audience', e.target.value)}
                placeholder="Describe your ideal customers and target market"
                rows={3}
                className="bg-slate-900/60 border-slate-700 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Website URL
              </label>
              <Input
                type="url"
                value={profile.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://yourcompany.com"
                className="bg-slate-900/60 border-slate-700 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Brand Voice
              </label>
              <Select
                value={profile.brand_voice}
                onValueChange={(value) => handleInputChange('brand_voice', value)}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-foreground">
                  <SelectValue placeholder="Select your brand voice" />
                </SelectTrigger>
                <SelectContent>
                  {brandVoices.map((voice) => (
                    <SelectItem key={voice} value={voice}>
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? 'Saving...' : 'Save Business Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Your business profile helps AI employees provide more accurate and relevant assistance.
          </p>
        </div>
      </main>
    </div>
  );
};

export default BusinessProfile;