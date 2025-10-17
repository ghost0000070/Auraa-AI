import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$100",
    period: "/month",
    description: "Perfect for small teams getting started with AI",
    features: [
      "Up to 3 AI Employees",
      "Basic analytics dashboard", 
      "Email & chat support",
      "Core business integrations",
      "Standard security"
    ],
    cta: "Start Free Trial",
    variant: "outline" as const
  },
  {
    name: "Professional", 
    price: "$200",
    period: "/month",
    description: "For growing businesses that need advanced AI capabilities",
    features: [
      "Up to 15 AI Employees",
      "Advanced analytics & anomaly detection",
      "Priority support",
      "All integrations",
      "Enhanced security",
      "Custom AI Employee creation",
      "API access"
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true
  },
  {
    name: "Enterprise",
    price: "$400", 
    period: "/month",
    description: "For large organizations with complex AI workforce needs",
    features: [
      "Unlimited AI Employees",
      "Enterprise analytics suite",
      "24/7 dedicated support", 
      "Custom integrations",
      "Advanced security & compliance",
      "White-label options",
      "On-premise deployment",
      "Custom AI model training"
    ],
    cta: "Start Free Trial",
    variant: "accent" as const
  }
];

export const PricingSection = () => {
  const { user, subscriptionStatus, checkSubscription } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: planName, user_id: user.id }
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to create checkout session");
      window.open(data.url, "_blank");
      setTimeout(() => { checkSubscription(); }, 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Checkout failed", description: msg, variant: "destructive" });
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { user_id: user.id }
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to create portal session");
      window.open(data.url, "_blank");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Portal failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your <span className="text-gradient">AI Workforce</span> Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free, scale seamlessly. No setup fees, cancel anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`
                relative transition-all duration-300 hover-scale
                ${plan.popular ? "border-primary/50 glow-primary scale-105" : "hover:border-accent/50"}
              `}
            >
              {plan.popular && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 pulse-glow"
                >
                  🔥 Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <span className="w-2 h-2 rounded-full bg-accent mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.variant} 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    if (!user) { navigate('/auth'); return; }
                    if (subscriptionStatus?.subscribed) { handleManageSubscription(); return; }
                    handleSubscribe(plan.name);
                  }}
                >
                  {subscriptionStatus?.subscribed ? 
                    "Manage Subscription" : 
                    (user ? plan.cta : "Sign Up to Start")
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};