import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const services = [
  { name: "Web Application", status: "operational", uptime: "99.99%" },
  { name: "API", status: "operational", uptime: "99.98%" },
  { name: "AI Engine", status: "operational", uptime: "99.95%" },
  { name: "Database", status: "operational", uptime: "99.99%" },
  { name: "Authentication", status: "operational", uptime: "99.99%" },
  { name: "Webhooks", status: "operational", uptime: "99.97%" },
  { name: "File Storage", status: "operational", uptime: "99.99%" },
  { name: "Email Service", status: "operational", uptime: "99.96%" }
];

const recentIncidents: { date: string; title: string; status: string; description: string }[] = [];

export default function Status() {
  const allOperational = services.every(s => s.status === "operational");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            System <span className="text-gradient">Status</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time status of Auraa AI services
          </p>
        </div>

        {/* Overall Status */}
        <Card className={`mb-8 ${allOperational ? 'bg-green-900/20 border-green-500/50' : 'bg-yellow-900/20 border-yellow-500/50'}`}>
          <CardContent className="flex items-center gap-4 py-6">
            {allOperational ? (
              <CheckCircle className="h-10 w-10 text-green-500" />
            ) : (
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
              </h2>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{service.uptime} uptime</span>
                    <span className="text-sm text-green-400 font-medium">Operational</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <p>No incidents reported in the last 90 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident, i) => (
                  <div key={i} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{incident.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{incident.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscribe */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Subscribe to status updates via email or RSS
          </p>
        </div>
      </div>
    </div>
  );
}
