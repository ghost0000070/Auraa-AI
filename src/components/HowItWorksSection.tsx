import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Select Your AI Employee",
    description: "Browse our marketplace of pre-trained AI agents. Whether you need a Sales Specialist, a Content Creator, or a Customer Support rep, we have an expert ready to join your team immediately."
  },
  {
    number: "02",
    title: "Customize & Onboard",
    description: "Provide your business context, brand voice guidelines, and specific goals. Your AI employee absorbs this information instantly to act as a true extension of your brand."
  },
  {
    number: "03",
    title: "Deploy & Monitor",
    description: "Activate your AI employee on your preferred channels (Email, Slack, Website). Track their performance in real-time through our advanced analytics dashboard and watch your productivity soar."
  }
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-6 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            How Auraa Works
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Deploying an enterprise-grade AI workforce has never been simpler. 
            Get up and running in three easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-sm hover:border-primary/50 transition-colors duration-300">
              <CardContent className="p-8 pt-12">
                <div className="absolute -top-6 -right-6 text-9xl font-bold text-white/5 select-none">
                  {step.number}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
