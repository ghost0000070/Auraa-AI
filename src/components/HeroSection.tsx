import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import analyticsImage from "@/assets/analytics-dashboard.png";

export const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto text-center">
        <Badge variant="secondary" className="mb-8 pulse-glow">
          ⚡ Voted #1 AI Workforce Platform
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Create Hundreds of{" "}
          <span className="text-gradient">AI Employees</span>
          <br />
          Inside Your Unified Platform
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Manage all Human Work and AI Work in a single platform with seamless handoff. 
          Enterprise-grade AI employees with advanced analytics and anomaly detection.
        </p>
        
        <div className="flex justify-center mb-16">
          <Button variant="hero" size="lg" className="text-lg px-8 py-6" onClick={handleCtaClick}>
            {user ? 'Go to Dashboard' : 'Try Auraa-AI for Free'}
          </Button>
        </div>
        
        {!user && (
          <p className="text-sm text-muted-foreground mb-12">
            Start your 3-day free trial. Cancel in 1 click.
          </p>
        )}
        
        <div className="relative max-w-5xl mx-auto">
          <img 
            src={analyticsImage} 
            alt="AI Analytics Dashboard"
            className="w-full rounded-2xl shadow-2xl glow-primary animate-float"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/20 to-transparent"></div>
        </div>
        
        <div className="mt-16">
          <p className="text-muted-foreground mb-8">
            Over 1 million top performers and teams trust Auraa-AI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-lg font-semibold">Y Combinator</div>
            <div className="text-lg font-semibold">Microsoft</div>
            <div className="text-lg font-semibold">Shopify</div>
            <div className="text-lg font-semibold">Stripe</div>
            <div className="text-lg font-semibold">OpenAI</div>
          </div>
        </div>
      </div>
    </section>
  );
};