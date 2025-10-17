import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { value: "$32 billion", label: "in GMV analyzed", color: "text-accent" },
  { value: "44 million", label: "orders processed", color: "text-primary" },
  { value: "19 million", label: "unique customers served", color: "text-success" }
];

const categories = [
  { icon: "🛍️", name: "Orders", description: "Smart order processing" },
  { icon: "🚚", name: "Logistics", description: "Supply chain optimization" },
  { icon: "💳", name: "Payments", description: "Transaction monitoring" },
  { icon: "🛡️", name: "Fraud", description: "Advanced fraud detection" },
  { icon: "💰", name: "Pricing", description: "Dynamic pricing strategy" },
  { icon: "📦", name: "Catalog", description: "Inventory management" }
];

export const AnalyticsSection = () => {
  return (
    <section id="analytics" className="py-20 px-6 card-gradient">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 pulse-glow">
            🎯 AI Anomaly Detection
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Turn Your Business{" "}
            <span className="text-gradient">Bulletproof</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced AI analytics with real-time anomaly detection across all business operations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <Card key={index} className="text-center border-accent/20">
              <CardContent className="p-8">
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-8">
            Predictive insights for faster, smarter decisions
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <Card 
              key={index} 
              className="text-center hover-scale cursor-pointer hover:border-accent/50 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="text-3xl mb-3">{category.icon}</div>
                <div className="font-semibold mb-2">{category.name}</div>
                <div className="text-xs text-muted-foreground">{category.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};