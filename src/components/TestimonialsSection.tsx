import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CMO at TechFlow",
    content: "Auraa's AI employees completely transformed our content strategy. We're producing 10x the content with higher engagement rates, all while maintaining our unique brand voice.",
    initials: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "Head of Sales at GrowthX",
    content: "The 'Deal Striker' agent is incredible. It handles all our initial outreach and qualification, so my team only speaks to warm leads. Our closing rate has doubled in two months.",
    initials: "MR"
  },
  {
    name: "Elena Kowalski",
    role: "Founder of Designify",
    content: "I was skeptical about AI support, but 'Support Sentinel' resolved 80% of our tickets instantly. Our customer satisfaction score went from 4.2 to 4.9 in weeks.",
    initials: "EK"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 px-6 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Trusted by Innovators
          </h2>
          <p className="text-lg text-slate-400">
            See what industry leaders are saying about their Auraa AI workforce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border border-white/10 bg-slate-900/40 backdrop-blur-sm shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="mb-6 text-primary text-4xl font-serif opacity-50">"</div>
                    <p className="text-lg text-slate-300 italic mb-6 leading-relaxed">
                      {testimonial.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <Avatar className="border border-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`} />
                      <AvatarFallback className="bg-slate-800 text-slate-400">{testimonial.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
