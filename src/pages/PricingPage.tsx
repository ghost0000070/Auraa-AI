import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

const PricingPage = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const premiumPriceId = 'price_1Oxx1WE07jSj9L3g8S1JyM1' // Replace with your actual Price ID

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("You must be logged in to subscribe.");
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const createCheckout = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckout({
        priceId: premiumPriceId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      const data = result.data as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-6">Pricing & Subscription</h1>
        
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Premium Plan</h2>
              <p className="text-muted-foreground">Unlock all features and AI employees.</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold">$29.99 / month</p>
              {subscriptionStatus?.subscribed ? (
                <p className="text-green-500">You are already subscribed!</p>
              ) : (
                <Button onClick={handleCheckout} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Subscribe Now'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingPage;
