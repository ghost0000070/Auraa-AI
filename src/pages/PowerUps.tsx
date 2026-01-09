import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, Check, Loader2, Search, Crown,
  AlertTriangle, TrendingUp, FileText, Eye, Heart,
  GitBranch, Clock, Mail, RefreshCw, CheckSquare,
  MessageSquare, Cloud, Database, Target, Webhook,
  Sparkles, Brain, GraduationCap, ScanEye, Mic,
  Shield, FileSearch, Lock, Globe,
  Smartphone, Video, Languages,
  Gauge, History, LayoutTemplate, Users, Upload, Activity, Code,
  Grid, BarChart3, Plug, MessageCircle, Rocket
} from 'lucide-react';
import { supabase } from "@/supabase";
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { powerUpsCatalog, powerUpCategories, type PowerUp } from '@/lib/powerups-catalog';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  AlertTriangle, TrendingUp, FileText, Eye, Heart,
  GitBranch, Clock, Mail, RefreshCw, CheckSquare,
  MessageSquare, Cloud, Database, Target, Zap, Webhook,
  Sparkles, Brain, GraduationCap, ScanEye, Mic,
  Shield, FileSearch, Lock, Globe,
  Smartphone, Video, Languages,
  Gauge, History, LayoutTemplate, Users, Upload, Activity, Code,
  Grid, BarChart3, Plug, MessageCircle, Rocket,
};

const categoryIconMap: Record<string, React.ElementType> = {
  Grid, BarChart3, GitBranch: GitBranch, Plug, Brain, Shield, MessageCircle, Rocket, Database,
  Workflow: GitBranch,
};

const PowerUps = () => {
  const { user, isAdmin } = useAuth();
  const [activePowerUps, setActivePowerUps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch user's active powerups
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPowerUps = async () => {
      try {
        const { data, error } = await supabase
          .from('user_powerups')
          .select('powerup_id, is_active, expires_at')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (error) throw error;
        
        // Filter out expired powerups
        const activeIds = new Set(
          (data || [])
            .filter(p => !p.expires_at || new Date(p.expires_at) > new Date())
            .map(p => p.powerup_id)
        );
        setActivePowerUps(activeIds);
      } catch (error) {
        console.error('Error fetching powerups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPowerUps();
  }, [user]);

  const handleSubscribe = async (powerUp: PowerUp) => {
    if (!user) {
      toast.error('Please sign in to subscribe to power-ups');
      return;
    }

    setSubscribing(powerUp.id);

    try {
      // Call Polar to create checkout for this powerup
      const { data, error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'create-powerup-checkout',
          powerupId: powerUp.id,
          powerupName: powerUp.name,
          powerupPrice: powerUp.price,
          successUrl: `${window.location.origin}/power-ups?subscribed=${powerUp.id}`,
          cancelUrl: `${window.location.origin}/power-ups`,
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
      setSubscribing(null);
    }
  };

  const handleCancel = async (powerUpId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'cancel-powerup',
          powerupId: powerUpId,
        }
      });

      if (error) throw error;

      setActivePowerUps(prev => {
        const next = new Set(prev);
        next.delete(powerUpId);
        return next;
      });

      toast.success('Power-up subscription cancelled');
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Could not cancel subscription');
    }
  };

  // Filter powerups
  const filteredPowerUps = powerUpsCatalog.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort: popular first, then new, then alphabetical
  const sortedPowerUps = [...filteredPowerUps].sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    if (a.new && !b.new) return -1;
    if (!a.new && b.new) return 1;
    return a.name.localeCompare(b.name);
  });

  const getCategoryIcon = (iconName: string) => {
    const Icon = categoryIconMap[iconName] || Grid;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Power-Ups Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Supercharge Your <span className="text-gradient">AI Workforce</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Add powerful capabilities to your AI employees. Each power-up is billed monthly at its listed price.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search power-ups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {powerUpCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-slate-800/50 border border-slate-700 px-4 py-2"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Stats */}
        <div className="flex gap-6 mb-8 text-sm text-muted-foreground">
          <span>{sortedPowerUps.length} power-ups available</span>
          <span className="text-green-400">{activePowerUps.size} active</span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="animate-pulse h-64 bg-slate-800/50 border-slate-700/50" />
            ))}
          </div>
        ) : (
          /* Power-Ups Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedPowerUps.map((powerUp) => {
              const Icon = iconMap[powerUp.icon] || Zap;
              const isActive = activePowerUps.has(powerUp.id) || isAdmin;
              const isSubscribing = subscribing === powerUp.id;

              return (
                <Card 
                  key={powerUp.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${
                    isActive ? 'border-green-500/50 bg-green-500/5' : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {powerUp.popular && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    {powerUp.new && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        New
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-green-500/20' : 'bg-primary/20'
                      }`}>
                        <Icon className={`w-6 h-6 ${isActive ? 'text-green-400' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0 pr-16">
                        <CardTitle className="text-base leading-tight">{powerUp.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {powerUp.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm min-h-[48px] line-clamp-2">
                      {powerUp.description}
                    </CardDescription>

                    {/* Features */}
                    <ul className="space-y-1">
                      {powerUp.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {powerUp.features.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-5">
                          +{powerUp.features.length - 3} more
                        </li>
                      )}
                    </ul>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                      <div>
                        <span className="text-2xl font-bold">${powerUp.price}</span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                      </div>

                      {isActive ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                          {!isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(powerUp.id)}
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSubscribe(powerUp)}
                          disabled={isSubscribing}
                        >
                          {isSubscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Subscribe'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedPowerUps.length === 0 && (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No power-ups found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-2">How do power-ups work?</h3>
              <p className="text-muted-foreground text-sm">
                Power-ups are monthly add-on subscriptions that enhance your AI employees with additional capabilities. 
                Each power-up is billed separately at its listed price and can be cancelled anytime.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-2">Can I use multiple power-ups?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can subscribe to as many power-ups as you need. They all work together to enhance your AI workforce.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-2">How do I cancel a power-up?</h3>
              <p className="text-muted-foreground text-sm">
                Click the "Cancel" button next to any active power-up. Your access will continue until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerUps;
