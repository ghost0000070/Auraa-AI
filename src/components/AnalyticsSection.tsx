import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/supabase";
import { useAuth } from "@/hooks/useAuth";

interface MetricData {
    value: string;
    label: string;
    color: string;
}

interface AnalyticsSectionProps {
    isDashboard?: boolean;
}

interface User {
    role: string;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ isDashboard = false }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultMetrics = useMemo(() => isDashboard ? [
      { value: "0", label: "tasks completed", color: "text-primary" },
      { value: "0", label: "active employees", color: "text-accent" },
      { value: "$0", label: "est. cost saved", color: "text-success" }
    ] : [
      { value: "$32B+", label: "in GMV analyzed", color: "text-accent" },
      { value: "44M+", label: "orders processed", color: "text-primary" },
      { value: "19M+", label: "customers served", color: "text-success" }
    ], [isDashboard]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      let queryRef;

      try {
        if (isDashboard && user) {
          const { data, error } = await supabase
            .from('user_analytics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data && !error) {
            setMetrics(isDashboard ? [
                { value: data.tasks_completed?.toString() || "0", label: "tasks completed", color: "text-primary" },
                { value: data.active_employees?.toString() || "0", label: "active employees", color: "text-accent" },
                { value: `$${data.cost_saved || 0}`, label: "est. cost saved", color: "text-success" }
              ] : [
                { value: `$${data.gmv || '32B+'}`, label: "in GMV analyzed", color: "text-accent" },
                { value: data.orders || '44M+', label: "orders processed", color: "text-primary" },
                { value: data.customers || '19M+', label: "customers served", color: "text-success" }
              ]);
          } else {
            setMetrics(defaultMetrics);
          }
        } else {
          // Platform-wide stats for admins
          if (!user) {
            setMetrics(defaultMetrics);
            setLoading(false);
            return;
          }

          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (userData?.role !== 'admin') {
            setMetrics(defaultMetrics);
            setLoading(false);
            return;
          }

          const { data: platformData } = await supabase
            .from('platform_stats')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (platformData) {
            setMetrics([
              { value: platformData.gmv_analyzed || defaultMetrics[0].value, label: "in GMV analyzed", color: "text-accent" },
              { value: platformData.orders_processed || defaultMetrics[1].value, label: "orders processed", color: "text-primary" },
              { value: platformData.customers_served || defaultMetrics[2].value, label: "unique customers served", color: "text-success" }
            ]);
          } else {
            setMetrics(defaultMetrics);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${isDashboard ? 'user' : 'platform'} metrics`, error);
        setMetrics(defaultMetrics);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [isDashboard, user, defaultMetrics]);

  const categories = [
    { icon: "🛍️", name: "Orders", description: "Smart order processing" },
    { icon: "🚚", name: "Logistics", description: "Supply chain optimization" },
    { icon: "💳", name: "Payments", description: "Transaction monitoring" },
    { icon: "🛡️", name: "Fraud", description: "Advanced fraud detection" },
    { icon: "💰", name: "Pricing", description: "Dynamic pricing strategy" },
    { icon: "📦", name: "Catalog", description: "Inventory management" }
  ];

  return (
    <section id="analytics" className={`py-20 px-6 ${!isDashboard && 'card-gradient'}`}>
      <div className="container mx-auto">
        {!isDashboard && (
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 pulse-glow">🎯 AI Anomaly Detection</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Turn Your Business <span className="text-gradient">Bulletproof</span></h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Advanced AI analytics with real-time anomaly detection across all business operations</p>
            </div>
        )}
        
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isDashboard ? 'mb-8' : 'mb-16'}`}>
          {metrics.map((metric, index) => (
            <Card key={index} className={`text-center ${isDashboard ? 'bg-transparent' : 'border-accent/20'}`}>
              <CardContent className="p-8">
                {loading ? (
                    <div className="animate-pulse h-12 bg-slate-700 rounded mb-2 w-3/4 mx-auto"></div>
                ) : (
                    <div className={`text-4xl md:text-5xl font-bold mb-2 ${metric.color}`}>
                    {metric.value}
                    </div>
                )}
                <div className="text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!isDashboard && (
          <>
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold mb-8">Predictive insights for faster, smarter decisions</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <Card key={index} className="text-center hover-scale cursor-pointer hover:border-accent/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <div className="font-semibold mb-2">{category.name}</div>
                    <div className="text-xs text-muted-foreground">{category.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
