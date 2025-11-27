import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  DollarSign,
  MessageSquareText,
  Database,
  Code,
  GanttChart,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export interface AIEmployeeTemplate {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  icon: LucideIcon;
  image: string;
  color: string;
  colorClass: string;
  skills: string[];
  personality: string;
  monthlyCost: number;
  isPremium: boolean;
  exampleTasks: string[];
  backendTask: string;
}

const image = (keyword: string) =>
  `https://images.unsplash.com/` +
  keyword +
  `?auto=format&fit=crop&w=900&q=80`;

export const aiEmployeeTemplates: AIEmployeeTemplate[] = [
  {
    id: "marketing-pro",
    name: "Marketing Pro",
    role: "Growth Strategist",
    category: "Marketing",
    description: "Analyzes campaign data, writes high-converting copy, and optimizes funnels end-to-end.",
    icon: Megaphone,
    image: image("photo-1517245386807-bb43f82c33c4"),
    color: "#2563eb",
    colorClass: "bg-blue-500",
    skills: ["Campaign analytics", "Copywriting", "A/B testing"],
    personality: "Energetic hype-builder who speaks in data-backed soundbites.",
    monthlyCost: 249,
    isPremium: false,
    exampleTasks: [
      "Summarize performance of last week's paid campaigns",
      "Draft three subject lines for the winter promo",
      "Suggest a new nurture drip for freemium users",
    ],
    backendTask: "analyzeMarketingData",
  },
  {
    id: "sales-sidekick",
    name: "Sales Sidekick",
    role: "Pipeline Hunter",
    category: "Sales",
    description: "Automates personalized outreach, surfaces hot leads, and drafts follow-ups that close.",
    icon: DollarSign,
    image: image("photo-1485217988980-11786ced9454"),
    color: "#16a34a",
    colorClass: "bg-emerald-500",
    skills: ["Prospecting", "Lead scoring", "Objection handling"],
    personality: "Confident closer that keeps things upbeat and actionable.",
    monthlyCost: 299,
    isPremium: true,
    exampleTasks: [
      "Score last week's inbound demo requests",
      "Draft a follow-up for the ACME procurement team",
      "Summarize stalled deals and next steps",
    ],
    backendTask: "automateSalesOutreach",
  },
  {
    id: "support-sentinel",
    name: "Support Sentinel",
    role: "Customer Guardian",
    category: "Support",
    description: "Triages tickets, drafts empathetic replies, and keeps CSAT green around the clock.",
    icon: MessageSquareText,
    image: image("photo-1529333166437-7750a6dd5a70"),
    color: "#f59e0b",
    colorClass: "bg-amber-500",
    skills: ["Ticket routing", "Knowledge-base search", "QA escalation"],
    personality: "Calm, reassuring, and laser-focused on resolution.",
    monthlyCost: 189,
    isPremium: false,
    exampleTasks: [
      "Draft a response for the billing discrepancy ticket",
      "Escalate recurring login failures with context",
      "Summarize top issues from the last 24h",
    ],
    backendTask: "handleSupportTicket",
  },
  {
    id: "business-analyst",
    name: "Business Analyst",
    role: "Insight Architect",
    category: "Business",
    description: "Connects revenue, product, and ops data to surface actionable narratives for leadership.",
    icon: Database,
    image: image("photo-1494172961521-33799ddd43a5"),
    color: "#7c3aed",
    colorClass: "bg-purple-500",
    skills: ["SQL", "Cohort analysis", "Executive summaries"],
    personality: "Measured analyst who writes crisp executive-ready insights.",
    monthlyCost: 329,
    isPremium: true,
    exampleTasks: [
      "Explain Q3 revenue variance vs forecast",
      "Build a quick cohort table for 2024 signups",
      "Summarize churn reasons for enterprise accounts",
    ],
    backendTask: "analyzeBusinessData",
  },
  {
    id: "dev-companion",
    name: "Dev Companion",
    role: "Full-stack Partner",
    category: "Engineering",
    description: "Generates boilerplate, explains stack traces, and reviews pull requests in minutes.",
    icon: Code,
    image: image("photo-1515879218367-8466d910aaa4"),
    color: "#0ea5e9",
    colorClass: "bg-sky-500",
    skills: ["Snippet generation", "Code review", "Test scaffolding"],
    personality: "Pragmatic engineer who cites docs and best practices.",
    monthlyCost: 279,
    isPremium: false,
    exampleTasks: [
      "Translate this API response into TypeScript types",
      "Suggest tests for the billing webhook handler",
      "Explain this Prisma migration error in simple terms",
    ],
    backendTask: "generateCode",
  },
  {
    id: "operations-orchestrator",
    name: "Ops Orchestrator",
    role: "Workflow Director",
    category: "Operations",
    description: "Keeps projects, vendors, and inventory humming with proactive nudges and alerts.",
    icon: GanttChart,
    image: image("photo-1503387762-592deb58ef4e"),
    color: "#f43f5e",
    colorClass: "bg-rose-500",
    skills: ["Timeline planning", "Resource allocation", "Risk tracking"],
    personality: "Direct project lead who keeps everyone accountable.",
    monthlyCost: 239,
    isPremium: false,
    exampleTasks: [
      "Draft a rollout plan for next week's launch",
      "Identify risks for the supply-chain refresh",
      "Prepare a stand-up summary for leadership",
    ],
    backendTask: "manageProjectTasks",
  },
  {
    id: "security-analyst",
    name: "Security Analyst",
    role: "Threat Hunter",
    category: "Security",
    description: "Monitors telemetry, reviews alerts, and recommends mitigation steps instantly.",
    icon: ShieldCheck,
    image: image("photo-1498050108023-c5249f4df085"),
    color: "#22d3ee",
    colorClass: "bg-cyan-400",
    skills: ["Log triage", "Playbook drafting", "Compliance checks"],
    personality: "Sober responder with a bias for secure defaults.",
    monthlyCost: 349,
    isPremium: true,
    exampleTasks: [
      "Explain the spike in failed SSO logins",
      "Draft a response for yesterday's phishing attempt",
      "List remediation steps for the open CVE alert",
    ],
    backendTask: "analyzeSecurityThreat",
  },
  {
    id: "ai-team-orchestrator",
    name: "AI Team Orchestrator",
    role: "Multi-agent Conductor",
    category: "AI",
    description: "Routes work between specialized agents, validates outputs, and hands off final briefs.",
    icon: Workflow,
    image: image("photo-1519389950473-47ba0277781c"),
    color: "#a855f7",
    colorClass: "bg-fuchsia-500",
    skills: ["Goal decomposition", "Agent routing", "Quality assurance"],
    personality: "Systems thinker that speaks in clear action plans.",
    monthlyCost: 399,
    isPremium: true,
    exampleTasks: [
      "Coordinate marketing + sales AI for the holiday promo",
      "Design a cross-team workflow for onboarding clients",
      "Audit yesterday's agent outputs for accuracy",
    ],
    backendTask: "orchestrateAiTeam",
  },
];
