import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Tier {
  name: string;
  price: string;
  features: string[];
  priceId: string;
}

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (tier: Tier) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const response = await createCheckoutSession({
        priceId: tier.priceId,
        successUrl: window.location.origin + '/dashboard',
        cancelUrl: window.location.origin,
      });
      const { sessionId } = response.data as { sessionId: string };
      // Redirect to Stripe checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Could not create a checkout session.",
        variant: "destructive",
      });
    }
  };

  const tiers: Tier[] = [
    {
      name: "Pro",
      price: "$29",
      features: [
        "10 AI Employees",
        "Advanced Analytics",
        "Priority Support",
        "Custom Integrations",
      ],
      priceId: "price_1PQUWzRqqYQ2g2a1n7V5Q5e0",
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
      priceId: "price_1PQUXnRqqYQ2g2a1o1a1a1a1",
    },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <Card key={tier.name}>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <p className="text-4xl font-bold">{tier.price}<span className="text-lg font-normal">/month</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Badge className="mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8" onClick={() => handleSubscribe(tier)}>
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
