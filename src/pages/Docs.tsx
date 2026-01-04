import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Code, Webhook, Key, Database, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const docSections = [
  {
    icon: Zap,
    title: "Quick Start",
    description: "Get up and running with Auraa AI in minutes",
    link: "#quickstart"
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Complete API documentation for developers",
    link: "#api"
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Set up real-time notifications and integrations",
    link: "#webhooks"
  },
  {
    icon: Key,
    title: "Authentication",
    description: "Secure your integrations with API keys and OAuth",
    link: "#auth"
  },
  {
    icon: Database,
    title: "Data Models",
    description: "Understand the structure of AI employees and tasks",
    link: "#models"
  },
  {
    icon: Book,
    title: "Guides",
    description: "Step-by-step tutorials for common use cases",
    link: "#guides"
  }
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to integrate and extend Auraa AI
          </p>
        </div>

        {/* Doc Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {docSections.map((section) => (
            <Card key={section.title} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <section.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Example */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-400" />
              Quick Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-green-400">{`// Create an AI Employee task
const response = await fetch('https://api.auraa-ai.com/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    employee_id: 'marketing-pro',
    task: 'Analyze last week campaign performance',
    priority: 'high'
  })
});

const task = await response.json();
console.log(task.result);`}</code>
            </pre>
          </CardContent>
        </Card>

        {/* External Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a 
            href="https://github.com/ghost0000070/Auraa-AI" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            GitHub Repository
          </a>
          <Link 
            to="/contact"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
