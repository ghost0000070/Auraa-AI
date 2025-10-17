import { AIEmployeeCard } from "./AIEmployeeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Import guardian images
import commerceCoreImage from "@/assets/commerce-core-guardian.jpg";
import cyberSageImage from "@/assets/cyber-sage-guardian.jpg";
import dataNexusImage from "@/assets/data-nexus-guardian.jpg";
import dealStrikerImage from "@/assets/deal-striker-guardian.jpg";
import growthHackerImage from "@/assets/growth-hacker-guardian.jpg";
import lifeOptimizerImage from "@/assets/life-optimizer-guardian.jpg";
import messageMatrixImage from "@/assets/message-matrix-guardian.jpg";
import quantumHelperImage from "@/assets/quantum-helper-guardian.jpg";
import supportShieldImage from "@/assets/support-shield-guardian.jpg";
import talentTrackerImage from "@/assets/talent-tracker-guardian.jpg";
import viralVortexImage from "@/assets/viral-vortex-guardian.jpg";
import wordForgeImage from "@/assets/word-forge-guardian.jpg";

const aiEmployees = [
  {
    name: "Milli",
    role: "Sales Manager",
    image: dealStrikerImage,
    skills: ["Cold Call Scripts", "Email Campaigns", "Deal Closing", "Client Pitches"],
    variant: "featured" as const,
    category: "sales"
  },
  {
    name: "Cassie", 
    role: "Customer Support Specialist",
    image: supportShieldImage,
    skills: ["Ticket Resolution", "Live Chat", "Brand Voice", "Customer Retention"],
    category: "customer_service"
  },
  {
    name: "Content Creator",
    role: "Content Creator", 
    image: wordForgeImage,
    skills: ["Blog Posts", "Social Content", "Storytelling", "Audience Engagement"],
    category: "content"
  },
  {
    name: "Dexter",
    role: "Data Analyst",
    image: dataNexusImage,
    skills: ["Data Analysis", "Forecasting", "Business Insights", "Performance Tracking"],
    category: "analytics"
  }
];

export const AIEmployeesSection = () => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  const handleCustomAIClick = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!subscriptionStatus?.subscribed) {
      toast({
        title: "Subscription Required",
        description: "Custom AI Employee creation requires an active subscription.",
        variant: "destructive"
      });
      return;
    }

    // Track custom AI creation interest
    if (user) {
      await supabase.from('user_analytics').insert({
        event_type: 'action_click',
        event_data: { 
          action: 'custom_ai_creation',
          subscription_tier: subscriptionStatus?.subscription_tier || 'free'
        }
      });
    }

    toast({
      title: "Contact Sales",
      description: "Custom AI Employee creation requires consultation. Redirecting to contact form...",
    });

    // Redirect to contact form with pre-filled context
    setTimeout(() => {
      window.open('mailto:sales@auraa.ai?subject=Custom AI Employee Creation&body=I am interested in creating custom AI employees for my organization.', '_blank');
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
          {aiEmployees.map((employee, index) => (
            <AIEmployeeCard key={index} {...employee} clickable={true} />
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
};