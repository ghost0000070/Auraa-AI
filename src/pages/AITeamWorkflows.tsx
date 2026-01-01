import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates.tsx';
import { TemplateIcon } from '@/components/TemplateIcon';

const AITeamWorkflows: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
            <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        AI Team Workflows
                    </h1>
                    <Button onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <section className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
                        Orchestrate Your AI Workforce
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Combine the strengths of your AI employees to create powerful, automated workflows that handle complex business processes from end to end.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {aiEmployeeTemplates.map((employee) => (
                        <Card key={employee.id} className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold text-primary">{employee.name}</CardTitle>
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${employee.colorClass}`}
                                    style={{ backgroundColor: employee.color }}
                                >
                                    <TemplateIcon icon={employee.icon} className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{employee.role}</p>
                                <p className="text-sm font-medium">Expertise:</p>
                                <p className="text-xs text-muted-foreground">{employee.skills.join(', ')}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <section className="mt-16 text-center">
                    <h3 className="text-3xl font-bold mb-4">Ready to Build Your Automated Team?</h3>
                    <p className="text-muted-foreground mb-8">
                        Start by deploying your first AI employee and then create a custom workflow to fit your business needs.
                    </p>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600" onClick={() => navigate('/ai-employees')}>
                        <Zap className="w-5 h-5 mr-2" />
                        Deploy Your First AI Employee
                    </Button>
                </section>
            </main>
        </div>
    );
};

export default AITeamWorkflows;