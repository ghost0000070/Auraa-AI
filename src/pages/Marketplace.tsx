
import React from 'react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { TrendingDown, Zap } from 'lucide-react';

// Competitor average prices for comparison (based on market research)
const competitorPrices: Record<string, number> = {
  'marketing-pro': 249,
  'sales-sidekick': 349,
  'support-sentinel': 189,
  'business-analyst': 399,
  'dev-companion': 299,
  'operations-orchestrator': 249,
  'security-analyst': 399,
  'ai-team-orchestrator': 599,
};

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSubscriber } = useAuth();

  const handleDeploy = (templateId: string, templateName: string) => {
    if (!user) {
      toast.error('Please sign in to deploy AI employees');
      navigate('/auth');
      return;
    }
    if (!isSubscriber) {
      toast.error('Subscription required to deploy AI employees');
      navigate('/pricing');
      return;
    }
    // Navigate to AI employees page to use the deployment card
    navigate('/ai-employees');
  };

  const getSavings = (templateId: string, ourPrice: number) => {
    const competitorPrice = competitorPrices[templateId] || ourPrice * 2;
    const savings = competitorPrice - ourPrice;
    const percentSaved = Math.round((savings / competitorPrice) * 100);
    return { competitorPrice, savings, percentSaved };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
            <TrendingDown className="w-3 h-3 mr-1" />
            Up to 70% cheaper than competitors
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Employee <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy powerful AI employees at a fraction of the cost. See how much you save compared to competitors.
          </p>
        </div>

        {/* Comparison Banner */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-1">💰 Why Auraa AI?</h3>
              <p className="text-muted-foreground">We offer the same capabilities as Relevance AI, Lindy, and Beam AI — at 50-70% less.</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-green-400">$79</p>
                <p className="text-xs text-muted-foreground">Starting price</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">60%</p>
                <p className="text-xs text-muted-foreground">Avg. savings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">8</p>
                <p className="text-xs text-muted-foreground">AI Employees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiEmployeeTemplates.map((template) => {
            const { competitorPrice, savings, percentSaved } = getSavings(template.id, template.monthlyCost);
            
            return (
              <Card key={template.id} className="bg-slate-800/50 border-slate-700/50 hover:border-primary/50 transition-all overflow-hidden">
                {/* Savings Banner */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Save ${savings}/mo vs competitors</span>
                  <Badge className="bg-white/20 text-white border-0">{percentSaved}% OFF</Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${template.colorClass}`}>
                        <template.icon className="w-4 h-4 text-white" />
                      </span>
                      {template.name}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${template.isPremium ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {template.isPremium ? 'Premium' : 'Standard'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.skills.map((skill) => (
                        <span key={skill} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price Comparison */}
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Competitors avg:</span>
                      <span className="text-lg text-muted-foreground line-through">${competitorPrice}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-400">Auraa AI:</span>
                      <span className="text-2xl font-bold text-green-400">${template.monthlyCost}/mo</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">You save:</span>
                      <span className="text-lg font-bold text-white">${savings}/mo ({percentSaved}%)</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleDeploy(template.id, template.name)} 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Deploy Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Ready to save thousands?</h3>
            <p className="text-muted-foreground mb-6">
              Deploy your first AI employee today and see the difference. No hidden fees, no long contracts.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/pricing')}>View Plans</Button>
              <Button onClick={() => navigate('/ai-employees')} className="bg-gradient-to-r from-primary to-blue-600">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
