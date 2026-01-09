import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { aiEmployeeTemplates } from "@/lib/ai-employee-templates";

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBrowseEmployees = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Scroll to AI employees section
    const section = document.getElementById('ai-employees');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get first 4 employees from templates for preview
  const previewEmployees = aiEmployeeTemplates.slice(0, 4).map(employee => ({
    name: employee.name,
    role: employee.role,
    price: `$${employee.monthlyCost}`,
    icon: employee.category === 'Marketing' ? "🎯" : 
          employee.category === 'Sales' ? "💰" :
          employee.category === 'Support' ? "🛡️" : "📊",
    features: employee.skills.map(skill => skill),
  }));

  return (
    <section id="pricing" className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pay Per Employee. Not Per Tier.
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Subscribe to individual AI employees at their monthly rate. No packages, no tiers - just the specialists you need. Add or remove employees anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {previewEmployees.map((employee) => (
            <Card key={employee.name} className="flex flex-col hover:border-primary transition-colors">
              <CardHeader>
                <div className="text-4xl mb-2">{employee.icon}</div>
                <CardTitle className="text-xl">{employee.name}</CardTitle>
                <div className="text-xs text-muted-foreground mb-2">{employee.role}</div>
                <p className="text-3xl font-bold text-primary">{employee.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {employee.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">+ 4 more specialized employees available</p>
          <Button size="lg" onClick={handleBrowseEmployees}>
            {user ? 'Browse All Employees' : 'Sign Up to Browse'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Cancel individual employees anytime. No long-term contracts.
          </p>
        </div>
      </div>
    </section>
  );
}
