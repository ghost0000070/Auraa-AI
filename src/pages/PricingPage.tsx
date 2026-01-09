import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Per-employee pricing model - redirect to marketplace/dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl font-bold">Browse AI Employees</h1>
          <p className="text-muted-foreground">Subscribe to individual AI employees - pay only for what you need.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/dashboard')}>View My Employees</Button>
            <Button variant="outline" onClick={() => navigate('/#ai-employees')}>Browse Marketplace</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Pay Per Employee</h1>
        <p className="text-center text-muted-foreground mb-12">Subscribe to individual AI employees. No tiers, no packages - just what you need.</p>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Employee Pricing Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card p-6 rounded-lg border text-center">
              <div className="text-3xl font-bold text-primary mb-2">$79-$179</div>
              <p className="text-sm text-muted-foreground">Per employee/month</p>
            </div>
            <div className="bg-card p-6 rounded-lg border text-center">
              <div className="text-3xl font-bold text-primary mb-2">8+</div>
              <p className="text-sm text-muted-foreground">AI Employees Available</p>
            </div>
            <div className="bg-card p-6 rounded-lg border text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">Always Working</p>
            </div>
          </div>

          {/* Example Employees */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-bold mb-2">🎯 Marketing Pro</h3>
              <p className="text-muted-foreground mb-4">Campaign analytics, copywriting, A/B testing</p>
              <div className="text-2xl font-bold mb-4">$99/month</div>
              <Button className="w-full" onClick={() => navigate('/#ai-employees')}>View All Employees</Button>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-bold mb-2">💰 Sales Sidekick</h3>
              <p className="text-muted-foreground mb-4">Lead outreach, pipeline management, follow-ups</p>
              <div className="text-2xl font-bold mb-4">$129/month</div>
              <Button className="w-full" onClick={() => navigate('/#ai-employees')}>View All Employees</Button>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-primary/10 p-8 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4 text-center">How Per-Employee Pricing Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">1️⃣</div>
                <h4 className="font-bold mb-2">Browse Employees</h4>
                <p className="text-sm text-muted-foreground">Choose from our marketplace of specialized AI employees</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">2️⃣</div>
                <h4 className="font-bold mb-2">Subscribe</h4>
                <p className="text-sm text-muted-foreground">Pay monthly for each employee you activate</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">3️⃣</div>
                <h4 className="font-bold mb-2">Scale Anytime</h4>
                <p className="text-sm text-muted-foreground">Add or remove employees as your needs change</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Sign Up to Browse Employees
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account? <a href="/auth" className="text-primary hover:underline">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
