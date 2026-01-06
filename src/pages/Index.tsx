import { HeroSection } from "@/components/HeroSection";
import { AIEmployeesSection } from "@/components/AIEmployeesSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AIEmployeesSection />
      <AnalyticsSection />
      <FeaturesSection />
      {!user && <PricingSection />}
    </div>
  );
};

export default Index;
