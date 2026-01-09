import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, Heart, Zap, Users } from "lucide-react";

const openPositions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the future of AI workforce management with React, TypeScript, and Supabase."
  },
  {
    title: "AI/ML Engineer",
    department: "AI Research",
    location: "Remote",
    type: "Full-time",
    description: "Develop and optimize AI models that power our autonomous employees."
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Create intuitive experiences for managing AI teams at scale."
  },
  {
    title: "Developer Advocate",
    department: "Developer Relations",
    location: "Remote",
    type: "Full-time",
    description: "Help developers succeed with Auraa AI through content, community, and support."
  }
];

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision coverage" },
  { icon: Zap, title: "Equity", description: "Meaningful ownership in our growing company" },
  { icon: Clock, title: "Flexible Hours", description: "Work when you're most productive" },
  { icon: MapPin, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: Users, title: "Great Team", description: "Collaborate with talented, passionate people" },
  { icon: Briefcase, title: "Learning Budget", description: "$2,000/year for courses and conferences" }
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join the <span className="text-gradient">Future of Work</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us build the platform that's transforming how businesses operate with AI
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Auraa AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-4 p-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <benefit.icon className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position) => (
              <Card key={position.title} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all">
                <CardContent className="flex flex-col md:flex-row md:items-center justify-between py-6">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{position.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-purple-400">
                        <Briefcase className="h-4 w-4" /> {position.department}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {position.location}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" /> {position.type}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Don't see a role that fits? We're always looking for talented people.
          </p>
          <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
            Send General Application
          </Button>
        </div>
      </div>
    </div>
  );
}
