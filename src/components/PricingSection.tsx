import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";
import { useToast } from "@/components/ui/toast-hooks";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Tier {
  name: string;
  price: string;
  features: string[];
  priceId: string;
}

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: Tier) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsLoading(tier.priceId);
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionCallable');
      const response = await createCheckoutSession({
        priceId: tier.priceId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: window.location.origin,
      });
      
      const data = response.data as { url?: string };

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve checkout URL.");
      }

    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Could not create a checkout session.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(null);
    }
  };

  const tiers: Tier[] = [
    {
      name: "Pro",
      price: "$50",
      features: [
        "10 AI Employees",
        "Advanced Analytics",
        "Priority Support",
        "Custom Integrations",
      ],
      priceId: "price_1SY0gtJJkefvaMj1YLfG9FYX",
    },
    {
      name: "Enterprise",
      price: "$99",
      features: [
        "Unlimited AI Employees",
        "Dedicated Account Manager",
        "On-premise Deployment",
        "24/7 Support",
      ],
      priceId: "price_1SY0hwJJkefvaMj1cwQePfc",
    },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <p className="text-4xl font-bold">{tier.price}<span className="text-lg font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-4 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                    className="w-full mt-8" 
                    onClick={() => handleSubscribe(tier)}
                    disabled={!!isLoading}
                >
                    {isLoading === tier.priceId ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
