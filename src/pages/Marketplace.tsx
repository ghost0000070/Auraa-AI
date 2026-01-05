
import React from 'react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">AI Employee Marketplace</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {aiEmployeeTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {template.name}
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${template.isPremium ? 'bg-premium text-white' : 'bg-secondary'}`}>
                  {template.isPremium ? 'Premium' : 'Standard'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{template.description}</p>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {template.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">${template.monthlyCost}/mo</p>
                <Button onClick={() => handleDeploy(template.id, template.name)}>Deploy</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
