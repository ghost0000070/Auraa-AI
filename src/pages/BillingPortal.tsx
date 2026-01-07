import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Crown, Zap, Check, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SubscriptionInfo {
  tier: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const BillingPortal: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, is_active, subscription_ends_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setSubscription({
        tier: data.subscription_tier || 'free',
        status: data.is_active ? 'active' : 'inactive',
        current_period_end: data.subscription_ends_at,
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      // In production, this would redirect to Polar.sh customer portal
      window.open('https://polar.sh/settings/billing', '_blank');
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
      case 'premium':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'enterprise':
        return <Zap className="w-6 h-6 text-purple-500" />;
      default:
        return <CreditCard className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
      case 'premium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'unlimited':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['1 AI Employee', 'Basic automations', 'Community support'],
      current: subscription?.tier === 'free',
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      features: ['5 AI Employees', 'Advanced automations', 'Priority support', 'Custom integrations'],
      current: subscription?.tier === 'pro' || subscription?.tier === 'premium',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'month',
      features: ['Unlimited AI Employees', 'All features', 'Dedicated support', 'Custom solutions', 'SLA guarantee'],
      current: subscription?.tier === 'enterprise',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Billing & Subscription
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Current Plan */}
        <Card className="bg-slate-800/50 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getTierIcon(subscription?.tier || 'free')}
              Current Plan
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold capitalize">
                    {isAdmin ? 'Unlimited (Admin)' : subscription?.tier || 'Free'}
                  </span>
                  <Badge variant="outline" className={getTierColor(subscription?.tier || 'free')}>
                    {subscription?.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {subscription?.current_period_end && !isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.cancel_at_period_end
                      ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {!isAdmin && subscription?.tier !== 'enterprise' && (
                  <Button onClick={handleUpgrade}>
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                )}
                {subscription?.tier !== 'free' && !isAdmin && (
                  <Button variant="outline" onClick={handleManageSubscription} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <h2 className="text-xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-slate-800/50 border-slate-700/50 relative ${
                plan.popular ? 'ring-2 ring-primary' : ''
              } ${plan.current ? 'border-green-500/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {plan.current && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={handleUpgrade}
                  >
                    {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Billing History */}
        <Card className="bg-slate-800/50 border-slate-700/50 mt-8">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No billing history available</p>
              <p className="text-sm mt-1">Your invoices will appear here after your first payment</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BillingPortal;
