import React from 'react';
import { TrendingUp, Users, Zap, BarChart, MessageCircle, ShoppingCart, Mail, Heart, PenTool, UserCheck } from 'lucide-react';

// Import Power Guardian images
import cyberSageImage from '@/assets/cyber-sage-guardian.jpg';
import viralVortexImage from '@/assets/viral-vortex-guardian.jpg';
import quantumHelperImage from '@/assets/quantum-helper-guardian.jpg';
import dealStrikerImage from '@/assets/deal-striker-guardian.jpg';
import growthHackerImage from '@/assets/growth-hacker-guardian.jpg';
import supportShieldImage from '@/assets/support-shield-guardian.jpg';
import commerceCoreImage from '@/assets/commerce-core-guardian.jpg';
import dataNexusImage from '@/assets/data-nexus-guardian.jpg';
import messageMatrixImage from '@/assets/message-matrix-guardian.jpg';
import lifeOptimizerImage from '@/assets/life-optimizer-guardian.jpg';
import wordForgeImage from '@/assets/word-forge-guardian.jpg';
import talentTrackerImage from '@/assets/talent-tracker-guardian.jpg';

const getGuardianImage = (id: string) => {
    const imageMap: Record<string, string> = {
      'cyber-sage': cyberSageImage,
      'viral-vortex': viralVortexImage,
      'quantum-helper': quantumHelperImage,
      'deal-striker': dealStrikerImage,
      'growth-hacker': growthHackerImage,
      'support-shield': supportShieldImage,
      'commerce-core': commerceCoreImage,
      'data-nexus': dataNexusImage,
      'message-matrix': messageMatrixImage,
      'life-optimizer': lifeOptimizerImage,
      'word-forge': wordForgeImage,
      'talent-tracker': talentTrackerImage,
    };
    return imageMap[id] || cyberSageImage;
};

export const aiEmployeeTemplates = [
    {
      id: 'cyber-sage',
      name: 'Cyber-Sage',
      role: 'SEO Specialist',
      type: 'seo-specialist',
      description: 'Digital architect optimizing web presence with advanced SEO protocols, content enhancement algorithms, and search engine domination strategies.',
      skills: ['Keyword Research', 'Content Optimization', 'Technical SEO', 'Analytics'],
      avatar: getGuardianImage('cyber-sage'),
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: <TrendingUp className="w-6 h-6" />,
      popular: true
    },
    {
      id: 'viral-vortex',
      name: 'Viral-Vortex',
      role: 'Social Media Manager',
      type: 'social-media-manager',
      description: 'Social network commander deploying viral content strategies, trend analysis protocols, and community engagement systems across all digital platforms.',
      skills: ['Content Creation', 'Strategy Planning', 'Trend Analysis', 'Community Management'],
      avatar: getGuardianImage('viral-vortex'),
      color: 'bg-gradient-to-br from-pink-500 to-rose-600',
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 'quantum-helper',
      name: 'Quantum-Helper',
      role: 'Virtual Assistant',
      type: 'virtual-assistant',
      description: 'Multi-dimensional assistant processing complex scheduling matrices, workflow optimization, and executive task coordination with quantum efficiency.',
      skills: ['Scheduling', 'Email Management', 'Travel Planning', 'Task Organization'],
      avatar: getGuardianImage('quantum-helper'),
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 'deal-striker',
      name: 'Deal-Striker',
      role: 'Sales Manager',
      type: 'sales-manager',
      description: 'Revenue optimization engine crafting persuasive communication protocols, lead conversion algorithms, and deal-closing tactical systems.',
      skills: ['Cold Outreach', 'Sales Scripts', 'Pitch Development', 'Lead Conversion'],
      avatar: getGuardianImage('deal-striker'),
      color: 'bg-gradient-to-br from-orange-500 to-red-600',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'growth-hacker',
      name: 'Growth-Hacker',
      role: 'Business Development Manager',
      type: 'business-development',
      description: 'Strategic expansion specialist deploying growth acceleration frameworks, market penetration algorithms, and partnership development protocols.',
      skills: ['Growth Strategy', 'Market Analysis', 'Product Launch', 'Partnership Development'],
      avatar: getGuardianImage('growth-hacker'),
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      icon: <BarChart className="w-6 h-6" />,
      popular: true
    },
    {
      id: 'support-shield',
      name: 'Support-Shield',
      role: 'Customer Support Specialist',
      type: 'customer-support',
      description: 'Customer defense system deploying empathetic response protocols, issue resolution algorithms, and brand voice preservation technology.',
      skills: ['Customer Service', 'Query Resolution', 'Brand Voice', 'FAQ Creation'],
      avatar: getGuardianImage('support-shield'),
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      icon: <MessageCircle className="w-6 h-6" />
    },
    {
      id: 'commerce-core',
      name: 'Commerce-Core',
      role: 'eCommerce Manager',
      type: 'ecommerce-manager',
      description: 'Digital commerce commander optimizing store performance with conversion enhancement protocols, inventory management systems, and revenue maximization algorithms.',
      skills: ['Store Optimization', 'Product Launch', 'Inventory Management', 'Conversion Optimization'],
      avatar: getGuardianImage('commerce-core'),
      color: 'bg-gradient-to-br from-emerald-500 to-green-600',
      icon: <ShoppingCart className="w-6 h-6" />
    },
    {
      id: 'data-nexus',
      name: 'Data-Nexus',
      role: 'Data Analyst',
      type: 'data-analyst',
      description: 'Information processing nexus transforming raw data streams into predictive models, business intelligence frameworks, and actionable insight algorithms.',
      skills: ['Data Analysis', 'Forecasting', 'Business Intelligence', 'Report Generation'],
      avatar: getGuardianImage('data-nexus'),
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      icon: <BarChart className="w-6 h-6" />
    },
    {
      id: 'message-matrix',
      name: 'Message-Matrix',
      role: 'Email Marketing Specialist',
      type: 'email-marketing',
      description: 'Email orchestration engine deploying engagement optimization protocols, automated flow systems, and conversion-maximizing communication algorithms.',
      skills: ['Email Campaigns', 'Automation Flows', 'A/B Testing', 'List Segmentation'],
      avatar: getGuardianImage('message-matrix'),
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'life-optimizer',
      name: 'Life-Optimizer',
      role: 'Personal Growth Coach',
      type: 'personal-coach',
      description: 'Personal enhancement system deploying lifestyle optimization protocols, habit formation algorithms, and wellness maximization frameworks.',
      skills: ['Meal Planning', 'Fitness Coaching', 'Study Schedules', 'Habit Formation'],
      avatar: getGuardianImage('life-optimizer'),
      color: 'bg-gradient-to-br from-rose-500 to-red-600',
      icon: <Heart className="w-6 h-6" />
    },
    {
      id: 'word-forge',
      name: 'Word-Forge',
      role: 'Copywriter',
      type: 'copywriter',
      description: 'Content creation engine forging persuasive copy with conversion optimization algorithms, engagement enhancement protocols, and brand voice amplification systems.',
      skills: ['Ad Copy', 'Blog Writing', 'Landing Pages', 'Sales Copy'],
      avatar: getGuardianImage('word-forge'),
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      icon: <PenTool className="w-6 h-6" />,
      popular: true
    },
    {
      id: 'talent-tracker',
      name: 'Talent-Tracker',
      role: 'Recruiter',
      type: 'recruiter',
      description: 'Human resource acquisition system deploying candidate identification protocols, interview optimization algorithms, and team integration frameworks.',
      skills: ['Job Posting', 'Candidate Screening', 'Interview Planning', 'Team Onboarding'],
      avatar: getGuardianImage('talent-tracker'),
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      icon: <UserCheck className="w-6 h-6" />
    }
];