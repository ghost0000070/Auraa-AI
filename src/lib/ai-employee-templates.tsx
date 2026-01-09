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
  /** Proactive duties this employee performs autonomously without user prompting */
  autonomousDuties: string[];
  /** Decision prompt - what the AI asks itself when deciding what to do */
  decisionPrompt: string;
}

const image = (keyword: string) =>
  `https://images.unsplash.com/` +
  keyword +
  `?auto=format&fit=crop&w=900&q=80`;

export const aiEmployeeTemplates: AIEmployeeTemplate[] = [
  {
    id: "marketing-pro",
    name: "Echo",
    role: "Marketing Pro • Growth Strategist",
    category: "Marketing",
    description: "Analyzes campaign data, writes high-converting copy, and optimizes funnels end-to-end.",
    icon: Megaphone,
    image: image("photo-1517245386807-bb43f82c33c4"),
    color: "#2563eb",
    colorClass: "bg-blue-500",
    skills: ["Campaign analytics", "Copywriting", "A/B testing"],
    personality: "Energetic hype-builder who speaks in data-backed soundbites.",
    monthlyCost: 99,
    isPremium: false,
    exampleTasks: [
      "Summarize performance of last week's paid campaigns",
      "Draft three subject lines for the winter promo",
      "Suggest a new nurture drip for freemium users",
    ],
    backendTask: "analyzeMarketingData",
    autonomousDuties: [
      "Research competitor marketing strategies and identify gaps we can exploit",
      "Analyze our target audience and suggest content themes that resonate",
      "Generate social media content ideas based on trending topics in our industry",
      "Review our brand messaging and suggest improvements for better conversion",
      "Identify untapped marketing channels suitable for our business",
      "Create campaign concepts for upcoming seasons or events",
      "Analyze what makes successful businesses in our industry stand out",
    ],
    decisionPrompt: "As the Marketing Pro, analyze the business profile and determine: What marketing opportunity should I pursue right now to grow this business? Consider content gaps, audience engagement opportunities, and competitive advantages.",
  },
  {
    id: "sales-sidekick",
    name: "Milli",
    role: "Sales Sidekick • Pipeline Hunter",
    category: "Sales",
    description: "Automates personalized outreach, surfaces hot leads, and drafts follow-ups that close.",
    icon: DollarSign,
    image: image("photo-1485217988980-11786ced9454"),
    color: "#16a34a",
    colorClass: "bg-emerald-500",
    skills: ["Prospecting", "Lead scoring", "Objection handling"],
    personality: "Confident closer that keeps things upbeat and actionable.",
    monthlyCost: 129,
    isPremium: true,
    exampleTasks: [
      "Score last week's inbound demo requests",
      "Draft a follow-up for the ACME procurement team",
      "Summarize stalled deals and next steps",
    ],
    backendTask: "automateSalesOutreach",
    autonomousDuties: [
      "Research ideal customer profiles and identify new market segments",
      "Develop sales pitch variations for different buyer personas",
      "Analyze common objections and create response strategies",
      "Identify partnership opportunities with complementary businesses",
      "Create outreach templates for different stages of the sales cycle",
      "Research pricing strategies used by successful competitors",
      "Generate lead qualification criteria based on business goals",
    ],
    decisionPrompt: "As the Sales Sidekick, analyze the business profile and determine: What sales action should I take right now to increase revenue? Consider lead generation, pitch optimization, and closing strategies.",
  },
  {
    id: "support-sentinel",
    name: "Cassie",
    role: "Support Sentinel • Customer Guardian",
    category: "Support",
    description: "Triages tickets, drafts empathetic replies, and keeps CSAT green around the clock.",
    icon: MessageSquareText,
    image: image("photo-1529333166437-7750a6dd5a70"),
    color: "#f59e0b",
    colorClass: "bg-amber-500",
    skills: ["Ticket routing", "Knowledge-base search", "QA escalation"],
    personality: "Calm, reassuring, and laser-focused on resolution.",
    monthlyCost: 79,
    isPremium: false,
    exampleTasks: [
      "Draft a response for the billing discrepancy ticket",
      "Escalate recurring login failures with context",
      "Summarize top issues from the last 24h",
    ],
    backendTask: "handleSupportTicket",
    autonomousDuties: [
      "Analyze common customer pain points and suggest product improvements",
      "Create FAQ content based on frequently asked questions",
      "Develop customer onboarding guides and tutorials",
      "Identify at-risk customers based on support patterns",
      "Research best practices for customer retention in our industry",
      "Create response templates for common scenarios",
      "Suggest process improvements to reduce support volume",
    ],
    decisionPrompt: "As the Support Sentinel, analyze the business profile and determine: What customer experience improvement should I work on right now? Consider FAQ gaps, onboarding friction, and retention opportunities.",
  },
  {
    id: "business-analyst",
    name: "Dexter",
    role: "Business Analyst • Insight Architect",
    category: "Business",
    description: "Connects revenue, product, and ops data to surface actionable narratives for leadership.",
    icon: Database,
    image: image("photo-1494172961521-33799ddd43a5"),
    color: "#7c3aed",
    colorClass: "bg-purple-500",
    skills: ["SQL", "Cohort analysis", "Executive summaries"],
    personality: "Measured analyst who writes crisp executive-ready insights.",
    monthlyCost: 149,
    isPremium: true,
    exampleTasks: [
      "Explain Q3 revenue variance vs forecast",
      "Build a quick cohort table for 2024 signups",
      "Summarize churn reasons for enterprise accounts",
    ],
    backendTask: "analyzeBusinessData",
    autonomousDuties: [
      "Research industry benchmarks and compare our business performance",
      "Identify key metrics we should be tracking based on our goals",
      "Analyze market trends affecting our industry",
      "Create strategic recommendations for business growth",
      "Research successful business models in similar industries",
      "Identify operational inefficiencies and cost-saving opportunities",
      "Develop KPI frameworks for measuring business health",
    ],
    decisionPrompt: "As the Business Analyst, analyze the business profile and determine: What strategic insight should I develop right now to help leadership make better decisions? Consider market analysis, competitive positioning, and growth opportunities.",
  },
  {
    id: "dev-companion",
    name: "Cipher",
    role: "Dev Companion • Full-stack Partner",
    category: "Engineering",
    description: "Generates boilerplate, explains stack traces, and reviews pull requests in minutes.",
    icon: Code,
    image: image("photo-1515879218367-8466d910aaa4"),
    color: "#0ea5e9",
    colorClass: "bg-sky-500",
    skills: ["Snippet generation", "Code review", "Test scaffolding"],
    personality: "Pragmatic engineer who cites docs and best practices.",
    monthlyCost: 119,
    isPremium: false,
    exampleTasks: [
      "Translate this API response into TypeScript types",
      "Suggest tests for the billing webhook handler",
      "Explain this Prisma migration error in simple terms",
    ],
    backendTask: "generateCode",
    autonomousDuties: [
      "Research technology stack improvements for better performance",
      "Identify automation opportunities in development workflows",
      "Suggest architecture improvements based on best practices",
      "Create technical documentation templates",
      "Research emerging technologies relevant to our business",
      "Develop coding standards and guidelines",
      "Identify potential technical debt and remediation strategies",
    ],
    decisionPrompt: "As the Dev Companion, analyze the business profile and determine: What technical improvement should I research or document right now to help the business scale? Consider automation, architecture, and developer productivity.",
  },
  {
    id: "operations-orchestrator",
    name: "Atlas",
    role: "Ops Orchestrator • Workflow Director",
    category: "Operations",
    description: "Keeps projects, vendors, and inventory humming with proactive nudges and alerts.",
    icon: GanttChart,
    image: image("photo-1503387762-592deb58ef4e"),
    color: "#f43f5e",
    colorClass: "bg-rose-500",
    skills: ["Timeline planning", "Resource allocation", "Risk tracking"],
    personality: "Direct project lead who keeps everyone accountable.",
    monthlyCost: 99,
    isPremium: false,
    exampleTasks: [
      "Draft a rollout plan for next week's launch",
      "Identify risks for the supply-chain refresh",
      "Prepare a stand-up summary for leadership",
    ],
    backendTask: "manageProjectTasks",
    autonomousDuties: [
      "Research operational best practices for our industry",
      "Identify process bottlenecks and suggest improvements",
      "Create standard operating procedures for key workflows",
      "Research vendor options for common business needs",
      "Develop risk management frameworks",
      "Analyze resource allocation and optimization opportunities",
      "Create project templates for recurring initiatives",
    ],
    decisionPrompt: "As the Ops Orchestrator, analyze the business profile and determine: What operational improvement should I work on right now to make the business run more efficiently? Consider processes, workflows, and resource optimization.",
  },
  {
    id: "security-analyst",
    name: "Vex",
    role: "Security Analyst • Threat Hunter",
    category: "Security",
    description: "Monitors telemetry, reviews alerts, and recommends mitigation steps instantly.",
    icon: ShieldCheck,
    image: image("photo-1498050108023-c5249f4df085"),
    color: "#22d3ee",
    colorClass: "bg-cyan-400",
    skills: ["Log triage", "Playbook drafting", "Compliance checks"],
    personality: "Sober responder with a bias for secure defaults.",
    monthlyCost: 159,
    isPremium: true,
    exampleTasks: [
      "Explain the spike in failed SSO logins",
      "Draft a response for yesterday's phishing attempt",
      "List remediation steps for the open CVE alert",
    ],
    backendTask: "analyzeSecurityThreat",
    autonomousDuties: [
      "Research security best practices for our industry",
      "Identify compliance requirements and create checklists",
      "Develop security policies and guidelines",
      "Research common threats targeting businesses like ours",
      "Create incident response playbooks",
      "Analyze data privacy requirements and recommendations",
      "Suggest security tools and practices for our tech stack",
    ],
    decisionPrompt: "As the Security Analyst, analyze the business profile and determine: What security improvement should I research or document right now to protect the business? Consider compliance, threat prevention, and security best practices.",
  },
  {
    id: "ai-team-orchestrator",
    name: "Cortex",
    role: "AI Team Orchestrator • Multi-agent Conductor",
    category: "AI",
    description: "Routes work between specialized agents, validates outputs, and hands off final briefs.",
    icon: Workflow,
    image: image("photo-1519389950473-47ba0277781c"),
    color: "#a855f7",
    colorClass: "bg-fuchsia-500",
    skills: ["Goal decomposition", "Agent routing", "Quality assurance"],
    personality: "Systems thinker that speaks in clear action plans.",
    monthlyCost: 179,
    isPremium: true,
    exampleTasks: [
      "Coordinate marketing + sales AI for the holiday promo",
      "Design a cross-team workflow for onboarding clients",
      "Audit yesterday's agent outputs for accuracy",
    ],
    backendTask: "orchestrateAiTeam",
    autonomousDuties: [
      "Analyze how all employees can work together more effectively",
      "Identify tasks that require cross-functional collaboration",
      "Review employee outputs and suggest quality improvements",
      "Develop strategic initiatives that leverage multiple employees",
      "Create workflows for complex multi-step business processes",
      "Monitor overall team performance and suggest optimizations",
      "Delegate research tasks to appropriate specialized employees",
    ],
    decisionPrompt: "As the AI Team Orchestrator, analyze the business profile and all active employees to determine: What strategic initiative should I coordinate right now that leverages multiple team members? Consider cross-functional opportunities and team synergies.",
  },
];
