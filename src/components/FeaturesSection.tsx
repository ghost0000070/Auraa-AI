import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: "✉️",
    title: "Manage and draft emails",
    description: "Categorize emails, draft email replies, and immediately surface the most urgent emails that require action from you"
  },
  {
    icon: "🤝", 
    title: "Gather context for meetings",
    description: "Before each meeting, send the host a summary of all previous meetings, interactions, and data the company has with the invitee"
  },
  {
    icon: "📞",
    title: "CRM Integration & Lead Management", 
    description: "Automatically update CRM records, create follow-up tasks, and prepare presentation materials after sales calls with complete context tracking"
  },
  {
    icon: "⏰",
    title: "Timely follow-up with sales lead",
    description: "Diligently and perfectly time your follow-up emails with sales leads"
  },
  {
    icon: "📱",
    title: "Create daily social media content",
    description: "Create social media posts on each of LinkedIn, Facebook, Instagram, Twitter, and TikTok every morning and evening, using brand voice and content ideas"
  },
  {
    icon: "🎫",
    title: "Answer customer support ticket",
    description: "Use help center articles, internal knowledge base, operating procedure, and past ticket data to solve customer problems, take actions for customers, route issues to the correct department, and escalate emergencies according to guideline"
  },
  {
    icon: "📊",
    title: "Create project and assign work", 
    description: "Once you agree on a project scope with a customer, automatically create entire projects end-to-end, assign work to team members, and estimate project ETA with capacity & resource planning"
  },
  {
    icon: "⚡",
    title: "Create any Skill for any AI Employee",
    description: "Discover and build hundreds of Skills amongst your AI Employees across various departments"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See What Your <span className="text-gradient">AI Employees</span> Can Do
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Auraa-AI offers infinite possibilities, but here are some examples
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="hover-scale transition-all duration-300 hover:border-accent/50 group"
            >
              <CardContent className="p-6">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-accent">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};