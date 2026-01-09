import { AIEmployeeCard } from "./AIEmployeeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/supabase";
import { aiEmployeeTemplates } from "@/lib/ai-employee-templates";

export const AIEmployeesSection = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  const handleCustomAIClick = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!subscriptionStatus?.subscribed) {
      setError('Subscription Required: Custom AI Employee creation requires an active subscription.');
      return;
    }

    // Track custom AI creation interest
    if (user) {
      try {
        await supabase
          .from('user_analytics')
          .insert({
            user_id: user.id,
            event_type: 'action_click',
            event_data: { 
              action: 'custom_ai_creation',
              subscriptionTier: subscriptionStatus?.subscription_tier || 'free'
            }
          });
      } catch (error) {
        setError('Analytics tracking failed');
      }
    }

    toast.info("Request Submitted", {
      description: "Redirecting you to our custom AI request form...",
    });

    // Redirect to contact form instead of mailto
    setTimeout(() => {
      navigate('/contact');
    }, 1500);
  };

  return (
    <section id="ai-employees" className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Meet Your New <span className="text-gradient">AI Team</span>
        </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hire and set up enterprise-grade AI Employees within minutes, not months
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {aiEmployeeTemplates.map((employee) => (
            <AIEmployeeCard 
              key={employee.id} 
              name={employee.name}
              role={employee.role}
              image={employee.image}
              skills={employee.skills.slice(0, 4)}
              category={employee.category.toLowerCase()}
              clickable={true}
              variant={employee.id === 'sales-sidekick' ? 'featured' : undefined}
            />
          ))}
        </div>
        
        <div className="flex justify-center">
          <Card className="max-w-md text-center card-gradient border-dashed border-2 border-accent/30 hover:border-accent/60 transition-all duration-300 hover-scale">
            <CardContent className="p-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Build Your Own</h3>
              <p className="text-accent font-semibold mb-4">Custom AI Employee</p>
              <p className="text-sm text-muted-foreground mb-6">
                Use words to describe what your AI Employee does. Our team can custom-create AI Employees for your special needs!
              </p>
              <Button variant="accent" className="w-full" onClick={handleCustomAIClick}>
                {user ? (subscriptionStatus?.subscribed ? 'Create Custom AI' : 'Upgrade to Create') : 'Sign Up to Create'}
          </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
