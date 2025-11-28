
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DeploymentRequestCard } from '@/components/DeploymentRequestCard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AIEmployee {
  id: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  tools: unknown[];
  avatar: {
    url: string;
    bgColor: string;
  };
}

const AIEmployees: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user) return; // Don't fetch if user is not logged in

      try {
        // Ensure fresh auth token before Firestore reads
        await user.getIdToken(true);
        
        setLoading(true);
        const employeesCollection = collection(db, 'ai_employees');
        const employeeSnapshot = await getDocs(employeesCollection);
        const employeesList = employeeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AIEmployee));
        setEmployees(employeesList);
        setError(null);
      } catch (err) {
        console.error("Error fetching AI employees:", err);
        setError("Failed to load the AI workforce. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [user]); // Re-fetch if the user changes

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xl">Loading workforce...</p>
        </div>
      </div>
    );
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

        {error && (
          <div className="text-center text-red-500 bg-red-900/20 p-4 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((employee) => (
              <DeploymentRequestCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AIEmployees;
