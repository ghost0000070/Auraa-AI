import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Header } from "@/components/Header";

interface BusinessProfile {
  id?: string;
  name: string;
  description: string;
  industry: string;
  targetAudience: string;
  websiteUrl: string;
  brandVoice: string;
  businessData: Record<string, unknown>;
  isDefault: boolean;
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
    targetAudience: '',
    websiteUrl: '',
    brandVoice: '',
    businessData: {},
    isDefault: true
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const trackPageView = useCallback(async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'user_analytics'), {
        userId: user.uid,
        eventType: 'page_view',
        pagePath: '/business-profile',
        eventData: { timestamp: serverTimestamp() }
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [user]);

  const fetchBusinessProfile = useCallback(async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "businessProfiles", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          id: docSnap.id,
          name: data.name || '',
          description: data.description || '',
          industry: data.industry || '',
          targetAudience: data.targetAudience || '',
          websiteUrl: data.websiteUrl || '',
          brandVoice: data.brandVoice || '',
          businessData: data.businessData || {},
          isDefault: data.isDefault !== undefined ? data.isDefault : true
        });
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      toast.error("Error", {
        description: "Failed to load business profile",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // Allow time for auth to initialize
      return;
    }
    fetchBusinessProfile();
    trackPageView();
  }, [user, fetchBusinessProfile, trackPageView]);

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields: (keyof BusinessProfile)[] = ['name', 'industry', 'targetAudience'];
    const missingFields = requiredFields.filter(field => !profile[field]);
    
    if (missingFields.length > 0) {
      toast.error("Missing Required Fields", {
        description: `Please fill in: ${missingFields.join(', ')}`
      });
      return false;
    }
    
    return true;
  };

  const saveProfile = async () => {
    if (!user || !validateForm()) return;

    try {
      setSaving(true);

      await addDoc(collection(db, 'user_analytics'), {
        userId: user.uid,
        eventType: 'action_click',
        eventData: { 
          action: 'save_business_profile',
          has_existing_profile: !!profile.id
        },
        createdAt: serverTimestamp()
      });

      const profileData = {
        userId: user.uid,
        name: profile.name,
        description: profile.description,
        industry: profile.industry,
        targetAudience: profile.targetAudience,
        websiteUrl: profile.websiteUrl,
        brandVoice: profile.brandVoice,
        businessData: {
          ...(profile.businessData as object),
          updatedAt: serverTimestamp()
        },
        isDefault: profile.isDefault,
        isActive: true
      };

      const docRef = doc(db, "businessProfiles", user.uid);
      await setDoc(docRef, profileData, { merge: true });

      toast.success("Profile Saved", {
        description: "Your business profile has been saved successfully.",
      });

      // Navigate after successful save
      navigate('/dashboard');

    } catch (error) {
      console.error('Error saving business profile:', error);
      toast.error("Save Failed", {
        description: "Failed to save business profile",
      });
    } finally {
      setSaving(false);
    }
  };

  // Ensure we show loading state while auth is initializing or profile is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">Loading business profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24 max-w-2xl">
        <Card className="bg-slate-800/50 border border-slate-700/50 text-white">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription className="text-slate-400">
              Complete your business profile to enable AI employees and get personalized recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your company name"
                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Industry <span className="text-red-500">*</span>
              </label>
              <Select
                value={profile.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry} className="hover:bg-slate-700">
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Company Description
              </label>
              <Textarea
                value={profile.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company and what you do"
                rows={4}
                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={profile.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="Describe your ideal customers and target market"
                rows={3}
                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Website URL
              </label>
              <Input
                type="url"
                value={profile.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://yourcompany.com"
                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-300">
                Brand Voice
              </label>
              <Select
                value={profile.brandVoice}
                onValueChange={(value) => handleInputChange('brandVoice', value)}
              >
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                  <SelectValue placeholder="Select your brand voice" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {brandVoices.map((voice) => (
                    <SelectItem key={voice} value={voice} className="hover:bg-slate-700">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {saving ? 'Saving...' : 'Save Business Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Your business profile helps AI employees provide more accurate and relevant assistance.
          </p>
        </div>
      </main>
    </div>
  );
};

export default BusinessProfile;
