import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Book, Zap, Users, Settings, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const helpCategories = [
  {
    icon: Zap,
    title: "Getting Started",
    description: "Learn the basics of setting up your AI workforce",
    articles: ["Quick Start Guide", "Creating Your First AI Employee", "Understanding the Dashboard"]
  },
  {
    icon: Users,
    title: "AI Employees",
    description: "Manage and customize your AI team members",
    articles: ["AI Employee Types", "Customizing Skills", "Training Your AI"]
  },
  {
    icon: Settings,
    title: "Integrations",
    description: "Connect Auraa AI with your favorite tools",
    articles: ["CRM Integration", "Email Setup", "API Documentation"]
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Manage your subscription and payments",
    articles: ["Subscription Plans", "Payment Methods", "Invoices & Receipts"]
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Keep your data safe and secure",
    articles: ["Data Protection", "Access Controls", "Compliance"]
  },
  {
    icon: Book,
    title: "Best Practices",
    description: "Get the most out of your AI employees",
    articles: ["Workflow Optimization", "Team Coordination", "Performance Tips"]
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Help <span className="text-gradient">Center</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to your questions and learn how to get the most out of Auraa AI
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-slate-800/50 border-slate-700"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {helpCategories.map((category) => (
            <Card key={category.title} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <category.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.articles.map((article) => (
                    <li key={article} className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer">
                      → {article}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
          <CardContent className="flex flex-col md:flex-row items-center justify-between py-8">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <MessageCircle className="h-10 w-10 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold">Still need help?</h3>
                <p className="text-muted-foreground">Our support team is ready to assist you</p>
              </div>
            </div>
            <Link to="/contact">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
