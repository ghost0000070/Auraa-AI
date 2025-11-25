import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";

const plans = [
  {
    name: "Standard",
    price: "$10",
    priceId: "price_1PJNybF4O9ATi3lMTsV0Ea5Z",
    features: [
      "Access to all AI Employees",
      "Up to 1,000 requests per month",
      "Standard support",
    ],
  },
  {
    name: "Premium",
    price: "$25",
    priceId: "price_1PJNzwF4O9ATi3lM4nK5p2I3",
    features: [
      "Access to all AI Employees",
      "Unlimited requests",
      "Priority support",
      "Custom AI Employee creation",
    ],
  },
];

export const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const createCheckoutSession = httpsCallable(
      functions,
      "createCheckoutSession"
    );

    try {
      const result = await createCheckoutSession({ priceId });
      const data = result.data as { url: string };
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("An error occurred while creating the checkout session.");
    }
  };

  return (
    <div className="container mx-auto py-20 px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Choose Your Plan
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Unlock the full potential of Auraa with our subscription plans.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <p className="text-5xl font-bold text-center mb-6">{plan.price}<span className="text-lg font-normal">/month</span></p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribe(plan.priceId)} className="w-full mt-auto">
                Subscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
