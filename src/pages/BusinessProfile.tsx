import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabase";
import { toast } from "sonner";
import { 
  Building2, 
  Target, 
  Megaphone, 
  DollarSign, 
  Users, 
  Sparkles,
  Plus,
  X,
  Save,
  AlertCircle
} from "lucide-react";

interface EnhancedBusinessProfile {
  id?: string;
  // Basic Info
  name: string;
  description: string;
  industry: string;
  websiteUrl: string;
  location: string;
  foundingYear: number | null;
  employeeCount: string;
  annualRevenueRange: string;
  // Brand & Voice
  brandVoice: string;
  contentTone: string;
  missionStatement: string;
  coreValues: string[];
  uniqueValueProposition: string;
  // Target Market
  targetAudience: string;
  idealCustomerProfile: string;
  // Products & Services
  keyProducts: Array<{ name: string; description: string; price?: string }>;
  keyServices: Array<{ name: string; description: string }>;
  pricingModel: string;
  // Competition & Market
  competitors: Array<{ name: string; notes: string }>;
  keyChallenges: string[];
  primaryKeywords: string[];
  // Sales & Marketing
  salesCycleLength: string;
  averageDealSize: string;
  mainAcquisitionChannels: string[];
  // Social Media
  socialMedia: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  // Goals
  goals: string[];
}

const industries = [
  "Technology", "SaaS", "E-commerce", "Healthcare", "Finance", "Education", 
  "Retail", "Manufacturing", "Real Estate", "Consulting", "Marketing Agency",
  "Legal", "Non-profit", "Media & Entertainment", "Food & Beverage", "Travel", "Other"
];

const brandVoices = [
  "Professional", "Friendly", "Authoritative", "Casual", "Innovative", 
  "Trustworthy", "Energetic", "Sophisticated", "Approachable", "Bold", "Playful"
];

const contentTones = [
  "Educational", "Inspirational", "Conversational", "Technical", "Humorous",
  "Empathetic", "Direct", "Storytelling", "Data-driven", "Thought Leadership"
];

const pricingModels = [
  "Subscription (Monthly)", "Subscription (Annual)", "One-time Purchase", 
  "Freemium", "Usage-based", "Tiered Pricing", "Custom/Enterprise", "Marketplace Commission"
];

const salesCycles = [
  "Same day", "1-7 days", "1-4 weeks", "1-3 months", "3-6 months", "6+ months"
];

const dealSizes = [
  "Under $100", "$100-$500", "$500-$2,000", "$2,000-$10,000", 
  "$10,000-$50,000", "$50,000-$100,000", "$100,000+"
];

const acquisitionChannels = [
  "Organic Search (SEO)", "Paid Search (PPC)", "Social Media Organic", 
  "Social Media Ads", "Content Marketing", "Email Marketing", "Referrals",
  "Partnerships", "Direct Sales", "Events/Webinars", "Influencer Marketing"
];

const employeeCounts = [
  "Just me", "2-10", "11-50", "51-200", "201-500", "500+"
];

const revenueRanges = [
  "Pre-revenue", "Under $100K", "$100K-$500K", "$500K-$1M", 
  "$1M-$5M", "$5M-$10M", "$10M-$50M", "$50M+"
];

const defaultProfile: EnhancedBusinessProfile = {
  name: '',
  description: '',
  industry: '',
  websiteUrl: '',
  location: '',
  foundingYear: null,
  employeeCount: '',
  annualRevenueRange: '',
  brandVoice: '',
  contentTone: '',
  missionStatement: '',
  coreValues: [],
  uniqueValueProposition: '',
  targetAudience: '',
  idealCustomerProfile: '',
  keyProducts: [],
  keyServices: [],
  pricingModel: '',
  competitors: [],
  keyChallenges: [],
  primaryKeywords: [],
  salesCycleLength: '',
  averageDealSize: '',
  mainAcquisitionChannels: [],
  socialMedia: {},
  goals: [],
};

const BusinessProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EnhancedBusinessProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basics");
  
  // Temp inputs for array fields - separate state for each to avoid conflicts
  const [newCoreValue, setNewCoreValue] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newCompetitor, setNewCompetitor] = useState({ name: '', notes: '' });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '' });
  const [newService, setNewService] = useState({ name: '', description: '' });

  const fetchBusinessProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          id: data.id,
          name: data.business_name || '',
          description: data.description || '',
          industry: data.industry || '',
          websiteUrl: data.website_url || '',
          location: data.location || '',
          foundingYear: data.founding_year || null,
          employeeCount: data.employee_count || '',
          annualRevenueRange: data.annual_revenue_range || '',
          brandVoice: data.brand_voice || '',
          contentTone: data.content_tone || '',
          missionStatement: data.mission_statement || '',
          coreValues: data.core_values || [],
          uniqueValueProposition: data.unique_value_proposition || '',
          targetAudience: data.target_audience || '',
          idealCustomerProfile: data.ideal_customer_profile || '',
          keyProducts: data.key_products || [],
          keyServices: data.key_services || [],
          pricingModel: data.pricing_model || '',
          competitors: data.competitors || [],
          keyChallenges: data.key_challenges || [],
          primaryKeywords: data.primary_keywords || [],
          salesCycleLength: data.sales_cycle_length || '',
          averageDealSize: data.average_deal_size || '',
          mainAcquisitionChannels: data.main_acquisition_channels || [],
          socialMedia: data.social_media || {},
          goals: data.goals || [],
        });
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBusinessProfile();
    }
  }, [user, fetchBusinessProfile]);

  const handleInputChange = (field: keyof EnhancedBusinessProfile, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
    }));
  };

  const addToArray = (field: keyof EnhancedBusinessProfile, value: string, clearFn?: () => void) => {
    if (!value.trim()) return;
    const current = profile[field] as string[];
    if (!current.includes(value.trim())) {
      handleInputChange(field, [...current, value.trim()]);
    }
    if (clearFn) clearFn();
  };

  const removeFromArray = (field: keyof EnhancedBusinessProfile, index: number) => {
    const current = profile[field] as string[];
    handleInputChange(field, current.filter((_, i) => i !== index));
  };

  const addCompetitor = () => {
    if (!newCompetitor.name.trim()) return;
    handleInputChange('competitors', [...profile.competitors, { ...newCompetitor }]);
    setNewCompetitor({ name: '', notes: '' });
  };

  const addProduct = () => {
    if (!newProduct.name.trim()) return;
    handleInputChange('keyProducts', [...profile.keyProducts, { ...newProduct }]);
    setNewProduct({ name: '', description: '', price: '' });
  };

  const addService = () => {
    if (!newService.name.trim()) return;
    handleInputChange('keyServices', [...profile.keyServices, { ...newService }]);
    setNewService({ name: '', description: '' });
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!profile.name.trim()) {
      toast.error("Company name is required");
      setActiveTab("basics");
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        business_name: profile.name,
        description: profile.description,
        industry: profile.industry,
        website_url: profile.websiteUrl,
        location: profile.location,
        founding_year: profile.foundingYear,
        employee_count: profile.employeeCount,
        annual_revenue_range: profile.annualRevenueRange,
        brand_voice: profile.brandVoice,
        content_tone: profile.contentTone,
        mission_statement: profile.missionStatement,
        core_values: profile.coreValues,
        unique_value_proposition: profile.uniqueValueProposition,
        target_audience: profile.targetAudience,
        ideal_customer_profile: profile.idealCustomerProfile,
        key_products: profile.keyProducts,
        key_services: profile.keyServices,
        pricing_model: profile.pricingModel,
        competitors: profile.competitors,
        key_challenges: profile.keyChallenges,
        primary_keywords: profile.primaryKeywords,
        sales_cycle_length: profile.salesCycleLength,
        average_deal_size: profile.averageDealSize,
        main_acquisition_channels: profile.mainAcquisitionChannels,
        social_media: profile.socialMedia,
        goals: profile.goals,
      };

      const { error } = await supabase
        .from('business_profiles')
        .upsert(profileData);

      if (error) throw error;

      toast.success("Business profile saved! Your AI employees now have full context.");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile completeness
  const getCompleteness = () => {
    const fields = [
      profile.name, profile.description, profile.industry, profile.targetAudience,
      profile.uniqueValueProposition, profile.idealCustomerProfile, profile.brandVoice,
      profile.keyProducts.length > 0, profile.competitors.length > 0, profile.goals.length > 0,
      profile.keyChallenges.length > 0, profile.pricingModel
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">Loading business profile...</div>
      </div>
    );
  }

  const completeness = getCompleteness();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <main className="container mx-auto px-6 py-8 pt-24 max-w-4xl">
        {/* Completeness Banner */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-blue-600/20 border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Profile Completeness</span>
            </div>
            <Badge variant={completeness >= 80 ? "default" : completeness >= 50 ? "secondary" : "destructive"}>
              {completeness}%
            </Badge>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {completeness < 50 ? (
              <><AlertCircle className="w-4 h-4 inline mr-1" />Add more details so your AI employees can work more effectively</>
            ) : completeness < 80 ? (
              "Good progress! Add competitors, challenges, and goals for best results"
            ) : (
              "Excellent! Your AI employees have rich context to work with"
            )}
          </p>
        </div>

        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Advanced Business Profile
            </CardTitle>
            <CardDescription className="text-slate-400">
              The more details you provide, the more effectively your AI employees can work autonomously.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-6 bg-slate-900/50">
                <TabsTrigger value="basics" className="data-[state=active]:bg-primary">
                  <Building2 className="w-4 h-4 mr-1 hidden sm:block" /> Basics
                </TabsTrigger>
                <TabsTrigger value="brand" className="data-[state=active]:bg-primary">
                  <Megaphone className="w-4 h-4 mr-1 hidden sm:block" /> Brand
                </TabsTrigger>
                <TabsTrigger value="market" className="data-[state=active]:bg-primary">
                  <Target className="w-4 h-4 mr-1 hidden sm:block" /> Market
                </TabsTrigger>
                <TabsTrigger value="sales" className="data-[state=active]:bg-primary">
                  <DollarSign className="w-4 h-4 mr-1 hidden sm:block" /> Sales
                </TabsTrigger>
                <TabsTrigger value="goals" className="data-[state=active]:bg-primary">
                  <Users className="w-4 h-4 mr-1 hidden sm:block" /> Goals
                </TabsTrigger>
              </TabsList>

              {/* BASICS TAB */}
              <TabsContent value="basics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your company name"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Industry</label>
                    <Select value={profile.industry} onValueChange={(v) => handleInputChange('industry', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Company Description</label>
                  <Textarea
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="What does your company do? What problems do you solve?"
                    rows={3}
                    className="bg-slate-900/60 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Website URL</label>
                    <Input
                      value={profile.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Location</label>
                    <Input
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, Country or Remote"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Founded Year</label>
                    <Input
                      type="number"
                      value={profile.foundingYear || ''}
                      onChange={(e) => handleInputChange('foundingYear', parseInt(e.target.value) || null)}
                      placeholder="2024"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Team Size</label>
                    <Select value={profile.employeeCount} onValueChange={(v) => handleInputChange('employeeCount', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {employeeCounts.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Annual Revenue</label>
                    <Select value={profile.annualRevenueRange} onValueChange={(v) => handleInputChange('annualRevenueRange', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {revenueRanges.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Social Media</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'tiktok'].map(platform => (
                      <Input
                        key={platform}
                        value={profile.socialMedia[platform as keyof typeof profile.socialMedia] || ''}
                        onChange={(e) => handleSocialChange(platform, e.target.value)}
                        placeholder={`@${platform}`}
                        className="bg-slate-900/60 border-slate-700 text-white text-sm"
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* BRAND TAB */}
              <TabsContent value="brand" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Brand Voice</label>
                    <Select value={profile.brandVoice} onValueChange={(v) => handleInputChange('brandVoice', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="How does your brand speak?" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {brandVoices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Content Tone</label>
                    <Select value={profile.contentTone} onValueChange={(v) => handleInputChange('contentTone', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="How should content feel?" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {contentTones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">
                    Unique Value Proposition (UVP)
                  </label>
                  <Textarea
                    value={profile.uniqueValueProposition}
                    onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
                    placeholder="What makes you different from competitors? Why should customers choose you?"
                    rows={3}
                    className="bg-slate-900/60 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Mission Statement</label>
                  <Textarea
                    value={profile.missionStatement}
                    onChange={(e) => handleInputChange('missionStatement', e.target.value)}
                    placeholder="Your company's mission and purpose"
                    rows={2}
                    className="bg-slate-900/60 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Core Values</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCoreValue}
                      onChange={(e) => setNewCoreValue(e.target.value)}
                      placeholder="Add a core value"
                      className="bg-slate-900/60 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('coreValues', newCoreValue, () => setNewCoreValue('')))}
                    />
                    <Button onClick={() => addToArray('coreValues', newCoreValue, () => setNewCoreValue(''))} size="icon" variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.coreValues.map((value, i) => (
                      <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1">
                        {value}
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => removeFromArray('coreValues', i)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Primary Keywords (SEO)</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add a keyword"
                      className="bg-slate-900/60 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('primaryKeywords', newKeyword, () => setNewKeyword('')))}
                    />
                    <Button onClick={() => addToArray('primaryKeywords', newKeyword, () => setNewKeyword(''))} size="icon" variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.primaryKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="pl-3 pr-1 py-1">
                        {kw}
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => removeFromArray('primaryKeywords', i)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* MARKET TAB */}
              <TabsContent value="market" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Target Audience</label>
                  <Textarea
                    value={profile.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    placeholder="Who are your customers? Demographics, interests, behaviors..."
                    rows={3}
                    className="bg-slate-900/60 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Ideal Customer Profile (ICP)</label>
                  <Textarea
                    value={profile.idealCustomerProfile}
                    onChange={(e) => handleInputChange('idealCustomerProfile', e.target.value)}
                    placeholder="Describe your perfect customer in detail - job title, company size, pain points, budget..."
                    rows={3}
                    className="bg-slate-900/60 border-slate-700 text-white"
                  />
                </div>

                {/* Products */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Key Products</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      placeholder="Product name"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                    <Input
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))}
                        placeholder="Price"
                        className="bg-slate-900/60 border-slate-700 text-white"
                      />
                      <Button onClick={addProduct} size="icon" variant="secondary"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {profile.keyProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900/40 p-2 rounded">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.price && <span className="text-green-400 ml-2">{product.price}</span>}
                          {product.description && <p className="text-sm text-slate-400">{product.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleInputChange('keyProducts', profile.keyProducts.filter((_, idx) => idx !== i))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitors */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Competitors</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <Input
                      value={newCompetitor.name}
                      onChange={(e) => setNewCompetitor(c => ({ ...c, name: e.target.value }))}
                      placeholder="Competitor name"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newCompetitor.notes}
                        onChange={(e) => setNewCompetitor(c => ({ ...c, notes: e.target.value }))}
                        placeholder="Notes (strengths/weaknesses)"
                        className="bg-slate-900/60 border-slate-700 text-white"
                      />
                      <Button onClick={addCompetitor} size="icon" variant="secondary"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {profile.competitors.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900/40 p-2 rounded">
                        <div>
                          <span className="font-medium">{comp.name}</span>
                          {comp.notes && <p className="text-sm text-slate-400">{comp.notes}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleInputChange('competitors', profile.competitors.filter((_, idx) => idx !== i))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* SALES TAB */}
              <TabsContent value="sales" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Pricing Model</label>
                    <Select value={profile.pricingModel} onValueChange={(v) => handleInputChange('pricingModel', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="How do you charge?" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {pricingModels.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Sales Cycle</label>
                    <Select value={profile.salesCycleLength} onValueChange={(v) => handleInputChange('salesCycleLength', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="How long to close?" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {salesCycles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-300">Avg Deal Size</label>
                    <Select value={profile.averageDealSize} onValueChange={(v) => handleInputChange('averageDealSize', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-700 text-white">
                        <SelectValue placeholder="Typical deal value" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {dealSizes.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Main Acquisition Channels</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {acquisitionChannels.map(channel => (
                      <label key={channel} className="flex items-center gap-2 p-2 bg-slate-900/40 rounded cursor-pointer hover:bg-slate-900/60">
                        <input
                          type="checkbox"
                          checked={profile.mainAcquisitionChannels.includes(channel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('mainAcquisitionChannels', [...profile.mainAcquisitionChannels, channel]);
                            } else {
                              handleInputChange('mainAcquisitionChannels', profile.mainAcquisitionChannels.filter(c => c !== channel));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Key Services</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <Input
                      value={newService.name}
                      onChange={(e) => setNewService(s => ({ ...s, name: e.target.value }))}
                      placeholder="Service name"
                      className="bg-slate-900/60 border-slate-700 text-white"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newService.description}
                        onChange={(e) => setNewService(s => ({ ...s, description: e.target.value }))}
                        placeholder="Description"
                        className="bg-slate-900/60 border-slate-700 text-white"
                      />
                      <Button onClick={addService} size="icon" variant="secondary"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {profile.keyServices.map((service, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900/40 p-2 rounded">
                        <div>
                          <span className="font-medium">{service.name}</span>
                          {service.description && <p className="text-sm text-slate-400">{service.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleInputChange('keyServices', profile.keyServices.filter((_, idx) => idx !== i))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* GOALS TAB */}
              <TabsContent value="goals" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Business Goals</label>
                  <p className="text-xs text-slate-500 mb-2">What do you want to achieve? Your AI employees will prioritize work that supports these goals.</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="e.g., Increase MRR by 50%, Get 1000 new customers, Launch in Europe"
                      className="bg-slate-900/60 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('goals', newGoal, () => setNewGoal('')))}
                    />
                    <Button onClick={() => addToArray('goals', newGoal, () => setNewGoal(''))} size="icon" variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {profile.goals.map((goal, i) => (
                      <div key={i} className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-blue-600/20 p-3 rounded border border-primary/30">
                        <span>{goal}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromArray('goals', i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-300">Key Challenges</label>
                  <p className="text-xs text-slate-500 mb-2">What problems should your AI employees help solve?</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newChallenge}
                      onChange={(e) => setNewChallenge(e.target.value)}
                      placeholder="e.g., Low conversion rates, High churn, Not enough leads"
                      className="bg-slate-900/60 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('keyChallenges', newChallenge, () => setNewChallenge('')))}
                    />
                    <Button onClick={() => addToArray('keyChallenges', newChallenge, () => setNewChallenge(''))} size="icon" variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {profile.keyChallenges.map((challenge, i) => (
                      <div key={i} className="flex items-center justify-between bg-orange-500/10 p-3 rounded border border-orange-500/30">
                        <span className="text-orange-200">{challenge}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromArray('keyChallenges', i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-8 pt-4 border-t border-slate-700">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Business Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BusinessProfile;
