import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DeploymentRequestCard } from '@/components/DeploymentRequestCard';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { useAuth } from '@/hooks/useAuth';

const AIEmployees: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Power Guardians
            </h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              Deploy Elite AI Employees to Automate Your Business
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
            Meet Your AI Workforce
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Browse our roster of elite AI employees, each designed to excel in a specific domain. 
            Deploy them instantly to your team and start automating tasks, boosting productivity, and driving growth.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {aiEmployeeTemplates.map((employee) => (
            <DeploymentRequestCard key={employee.id} employee={employee} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default AIEmployees;