/**
 * Blog Agent Configuration
 * Product knowledge, content strategy, and learning parameters
 */

// Auraa AI Product Knowledge Base
export const AURAA_PRODUCT_KNOWLEDGE = {
  company: {
    name: 'Auraa AI',
    tagline: 'Deploy AI Employees That Work For You 24/7',
    mission: 'Empowering businesses with autonomous AI agents that handle tasks, automations, and workflows',
    website: 'https://www.auraa-ai.com',
    founded: '2025',
  },
  
  products: {
    platform: {
      name: 'Auraa AI Platform',
      description: 'A SaaS platform for deploying and managing autonomous AI employees',
      features: [
        'One-click AI employee deployment',
        'Real-time task monitoring and analytics',
        'Team coordination between multiple AI agents',
        'Browser automation and web scraping',
        'Integration with popular business tools',
        'Custom AI agent training and configuration',
        'Secure credential management',
        'Multi-user workspace support',
      ],
    },
    aiEmployees: {
      description: 'Pre-configured AI agents specialized for different business tasks',
      types: [
        { name: 'Research Analyst', tasks: ['market research', 'competitor analysis', 'data gathering'] },
        { name: 'Content Writer', tasks: ['blog posts', 'social media', 'marketing copy'] },
        { name: 'Customer Support Agent', tasks: ['ticket handling', 'FAQ responses', 'live chat'] },
        { name: 'Data Entry Specialist', tasks: ['form filling', 'data migration', 'spreadsheet updates'] },
        { name: 'Social Media Manager', tasks: ['post scheduling', 'engagement tracking', 'content curation'] },
        { name: 'Email Assistant', tasks: ['inbox management', 'reply drafting', 'follow-ups'] },
        { name: 'Sales Development Rep', tasks: ['lead research', 'outreach sequences', 'CRM updates'] },
        { name: 'HR Assistant', tasks: ['resume screening', 'interview scheduling', 'onboarding tasks'] },
      ],
    },
  },
  
  pricing: {
    tiers: [
      { name: 'Free', price: 0, employees: 1, features: ['Basic tasks', 'Community support'] },
      { name: 'Pro', price: 29, employees: 5, features: ['Advanced automation', 'Priority support', 'API access'] },
      { name: 'Enterprise', price: 99, employees: 'Unlimited', features: ['Custom training', 'Dedicated support', 'SSO'] },
    ],
  },
  
  targetAudience: [
    'Small business owners looking to automate repetitive tasks',
    'Entrepreneurs scaling their operations without hiring',
    'Marketing teams needing content and research automation',
    'Sales teams automating lead generation and follow-ups',
    'HR departments streamlining recruitment processes',
    'E-commerce businesses managing inventory and customer service',
    'Agencies managing multiple client workflows',
    'Productivity enthusiasts optimizing their workflows',
  ],
  
  competitors: [
    'Zapier (workflow automation, but no AI agents)',
    'Make.com (visual automation, limited AI)',
    'Bardeen (browser automation)',
    'Relevance AI (enterprise AI agents)',
  ],
  
  uniqueValue: [
    'Human-like AI employees, not just automation scripts',
    'Pre-trained specialists vs. generic chatbots',
    'Visual dashboard for managing AI team',
    'Pay per employee, not per task or API call',
    'Built-in browser automation capabilities',
    'No coding required',
  ],
};

// Content Strategy for the Blog Agent
export const CONTENT_STRATEGY = {
  categories: [
    {
      slug: 'ai-employees',
      name: 'AI Employees',
      description: 'Deep dives into AI agents and autonomous employees',
      frequency: 'weekly',
      priority: 10,
    },
    {
      slug: 'productivity',
      name: 'Productivity',
      description: 'Tips and strategies for working smarter',
      frequency: 'weekly',
      priority: 9,
    },
    {
      slug: 'automation',
      name: 'Business Automation',
      description: 'Automation strategies for modern businesses',
      frequency: 'biweekly',
      priority: 8,
    },
    {
      slug: 'case-studies',
      name: 'Case Studies',
      description: 'Real success stories from Auraa AI users',
      frequency: 'monthly',
      priority: 7,
    },
    {
      slug: 'tutorials',
      name: 'Tips & Tutorials',
      description: 'How-to guides and best practices',
      frequency: 'weekly',
      priority: 8,
    },
    {
      slug: 'product-updates',
      name: 'Product Updates',
      description: 'New features and improvements',
      frequency: 'as-needed',
      priority: 6,
    },
    {
      slug: 'future-of-work',
      name: 'Future of Work',
      description: 'Thought leadership on AI and work',
      frequency: 'biweekly',
      priority: 7,
    },
    {
      slug: 'tech-insights',
      name: 'Tech Insights',
      description: 'Behind the scenes of AI technology',
      frequency: 'monthly',
      priority: 5,
    },
  ],
  
  contentTypes: [
    { type: 'how-to', wordCount: '1500-2500', engagement: 'high' },
    { type: 'listicle', wordCount: '1200-2000', engagement: 'very-high' },
    { type: 'case-study', wordCount: '2000-3000', engagement: 'medium' },
    { type: 'thought-leadership', wordCount: '1500-2500', engagement: 'medium' },
    { type: 'comparison', wordCount: '2000-3000', engagement: 'high' },
    { type: 'news-analysis', wordCount: '800-1500', engagement: 'medium' },
    { type: 'product-announcement', wordCount: '500-1000', engagement: 'low' },
  ],
  
  toneOfVoice: {
    primary: 'professional yet approachable',
    characteristics: [
      'Confident but not arrogant',
      'Educational without being condescending',
      'Enthusiastic about AI without hype',
      'Practical and action-oriented',
      'Human and relatable (ironic for AI content)',
    ],
  },
  
  seoTargets: {
    primaryKeywords: [
      'AI employees',
      'AI automation',
      'autonomous AI agents',
      'business automation',
      'AI virtual assistant',
      'AI workforce',
      'automate business tasks',
    ],
    secondaryKeywords: [
      'AI productivity tools',
      'task automation software',
      'AI for small business',
      'virtual employee AI',
      'AI task management',
      'workflow automation AI',
    ],
    longTailKeywords: [
      'how to automate business tasks with AI',
      'best AI tools for small business automation',
      'AI employees vs human employees',
      'how to deploy AI agents for business',
      'AI automation for entrepreneurs',
    ],
  },
};

// Learning Configuration
export const LEARNING_CONFIG = {
  metrics: {
    engagementWeights: {
      views: 0.1,
      likes: 2.0,
      comments: 5.0,
      shares: 3.0,
      readTime: 1.5,
    },
    topPerformerThreshold: 0.1, // Top 10%
    learningWindowDays: 90,
  },
  
  adaptation: {
    minDataPoints: 10,
    confidenceThreshold: 0.7,
    updateFrequency: 'daily',
  },
  
  ideaGeneration: {
    sourcesWeights: {
      topPerformers: 0.3,
      trending: 0.25,
      productUpdates: 0.2,
      seasonal: 0.15,
      creative: 0.1,
    },
    diversityFactor: 0.3, // 30% should be outside top categories
  },
  
  contentOptimization: {
    titleLength: { min: 40, max: 70, optimal: 55 },
    excerptLength: { min: 100, max: 160, optimal: 140 },
    contentLength: { min: 1000, max: 5000, optimal: 2000 },
    headingsPerThousandWords: 3,
    imagesPerThousandWords: 1,
  },
};

// Blog Agent Personality
export const BLOG_AGENT_PERSONALITY = {
  name: 'Auraa Blog Agent',
  role: 'Content Strategist & Writer',
  traits: [
    'Knowledgeable about AI and automation',
    'Helpful and educational',
    'Engaging and conversational',
    'Data-driven decision maker',
    'Continuous learner',
  ],
  writingStyle: {
    format: 'Clear, scannable structure with headers and bullet points',
    voice: 'Second person (you/your) for tutorials, first person plural (we) for announcements',
    complexity: 'Accessible to non-technical readers, with technical depth when needed',
  },
  replyStyle: {
    tone: 'Friendly and helpful',
    length: 'Concise but thorough (50-200 words)',
    personalization: 'Reference the specific comment content',
    cta: 'Include soft call-to-action when appropriate',
  },
};
