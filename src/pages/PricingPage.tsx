import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/supabase';

const PricingPage = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async (tier: 'pro' | 'enterprise') => {
    if (!user) {
      toast.error("Please sign in first to subscribe.");
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      // Call the Polar subscription handler edge function
      const { data, error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'create-checkout',
          tier,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        // Redirect to Polar Checkout
        window.location.href = data.checkoutUrl;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        toast.error("Failed to initiate checkout.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl font-bold">Billing is managed in your dashboard</h1>
          <p className="text-muted-foreground">You are already signed in. Manage or view your plan from the dashboard.</p>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-center text-muted-foreground mb-12">Start your 3-day free trial. Cancel anytime.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Pro Plan */}
          <Card className="relative border-2 hover:border-primary transition-colors">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Pro</h2>
                <p className="text-muted-foreground">Perfect for growing businesses</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$50</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 10 AI Employees
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Advanced Analytics Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Priority Support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Custom Integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited script generation
                </li>
              </ul>

              {subscriptionStatus?.subscription_tier === 'pro' ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleCheckout('pro')} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Start Free Trial'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative border-2 border-primary bg-primary/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">Most Popular</span>
            </div>
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Enterprise</h2>
                <p className="text-muted-foreground">For scaling teams</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited AI Employees
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Dedicated Account Manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 24/7 Premium Support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Advanced API Access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Custom AI model training
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> White-label options
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> SLA guarantees
                </li>
              </ul>

              {subscriptionStatus?.subscription_tier === 'enterprise' ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleCheckout('enterprise')} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Subscribe'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {!user && (
          <p className="text-center text-muted-foreground mt-8">
            Already have an account? <a href="/auth" className="text-primary hover:underline">Sign in</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
