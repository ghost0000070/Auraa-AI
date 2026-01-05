import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/supabase";

interface Tier {
  name: string;
  price: string;
  features: string[];
  tier: 'pro' | 'enterprise';
  trial?: string;
  buttonText?: string;
}

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: Tier) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsLoading(tier.tier);
    try {
      // Create checkout via edge function (keeps Polar token server-side)
      const { data, error } = await supabase.functions.invoke('polar-subscription-handler', {
        body: {
          action: 'create-checkout',
          tier: tier.tier,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Failed to create checkout session");
      }

    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error((error as Error).message || "Could not create a checkout session.");
    } finally {
      setIsLoading(null);
    }
  };

  const tiers: Tier[] = [
    {
      name: "Pro Intro",
      price: "$39",
      trial: "30-day access to all AI employees",
      buttonText: "Start 30-Day Intro",
      features: [
        "30 days access to ALL AI employees",
        "Claude 3.5 Sonnet model included",
        "Advanced Analytics Dashboard",
        "Priority Support",
        "After 30 days: subscribe to employees you want",
        "No commitment - cancel anytime",
      ],
      tier: "pro",
    },
    {
      name: "Enterprise Intro",
      price: "$79",
      trial: "30-day access to all AI employees",
      buttonText: "Start 30-Day Intro",
      features: [
        "30 days access to ALL AI employees",
        "Claude Sonnet 4.5 model (most powerful)",
        "Dedicated Account Manager",
        "24/7 Premium Support",
        "Advanced API Access",
        "After 30 days: subscribe to employees you want",
      ],
      tier: "enterprise",
    },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Start with 30-Day Intro Access
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Try ALL AI employees for 30 days. After your intro period, subscribe only to the employees you want to keep at their individual prices.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.trial && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                      {tier.trial}
                    </span>
                  )}
                </div>
                <p className="text-4xl font-bold">{tier.price}<span className="text-lg font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-3 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                    className="w-full mt-8" 
                    onClick={() => handleSubscribe(tier)}
                    disabled={!!isLoading}
                >
                    {isLoading === tier.tier ? <Loader2 className="h-4 w-4 animate-spin"/> : (tier.buttonText || 'Subscribe')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
