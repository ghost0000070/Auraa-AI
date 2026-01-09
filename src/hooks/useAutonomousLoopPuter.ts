import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';

const LOOP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes - more aggressive
const MAX_ACTIONS_PER_EMPLOYEE = 2; // Allow multiple actions per cycle

/**
 * Safely truncate a result to a max length.
 * Handles strings, objects, and undefined/null values.
 */
function safeResultString(result: unknown, maxLength = 10000, fallback = 'Completed'): string {
  if (result === undefined || result === null) {
    return fallback;
  }
  if (typeof result === 'string') {
    return result.substring(0, maxLength);
  }
  // If it's an object, stringify it
  try {
    const str = JSON.stringify(result);
    return str.substring(0, maxLength);
  } catch {
    return fallback;
  }
}

// Enhanced employee template configurations with rich autonomous duties
const EMPLOYEE_TEMPLATES: Record<string, { autonomousDuties: string[]; decisionPrompt: string; workTypes: string[] }> = {
  'marketing-pro': {
    autonomousDuties: [
      "Create social media content calendar with specific post ideas",
      "Analyze competitor marketing and identify gaps we can exploit",
      "Write email marketing sequences for different customer segments",
      "Generate blog post outlines targeting our primary keywords",
      "Create ad copy variations for paid campaigns",
      "Develop influencer outreach strategies",
      "Write press release drafts for company news",
      "Create customer testimonial interview questions",
    ],
    decisionPrompt: "As the Marketing Pro, analyze the business and decide what marketing work to execute RIGHT NOW.",
    workTypes: ['content', 'strategy', 'research', 'campaign', 'copy'],
  },
  'sales-sidekick': {
    autonomousDuties: [
      "Create cold outreach templates for different buyer personas",
      "Develop objection handling playbooks",
      "Write follow-up email sequences",
      "Create sales battle cards vs each competitor",
      "Develop discovery call question frameworks",
      "Create proposal templates and pricing presentations",
      "Write LinkedIn connection request templates",
      "Develop referral request scripts",
    ],
    decisionPrompt: "As the Sales Sidekick, what sales asset or strategy should I create RIGHT NOW to help close more deals?",
    workTypes: ['outreach', 'playbook', 'template', 'strategy', 'analysis'],
  },
  'business-analyst': {
    autonomousDuties: [
      "Create detailed market size and opportunity analysis",
      "Develop financial projections and models",
      "Analyze customer acquisition cost optimization strategies",
      "Create competitive intelligence reports",
      "Develop pricing strategy recommendations",
      "Create investor pitch deck content",
      "Analyze unit economics and suggest improvements",
      "Create strategic partnership opportunity assessments",
    ],
    decisionPrompt: "As the Business Analyst, what strategic analysis or recommendation should I develop RIGHT NOW?",
    workTypes: ['analysis', 'strategy', 'research', 'model', 'report'],
  },
  'support-sentinel': {
    autonomousDuties: [
      "Create comprehensive FAQ documentation",
      "Develop customer onboarding email sequences",
      "Write help center articles for common issues",
      "Create customer success playbooks",
      "Develop NPS follow-up workflows",
      "Create product tutorial scripts",
      "Develop churn prevention strategies",
      "Write customer milestone celebration messages",
    ],
    decisionPrompt: "As the Support Sentinel, what customer experience improvement should I create RIGHT NOW?",
    workTypes: ['documentation', 'workflow', 'template', 'guide', 'strategy'],
  },
  'dev-companion': {
    autonomousDuties: [
      "Create technical architecture documentation",
      "Develop API integration guides",
      "Write technical specification documents",
      "Create code review checklists",
      "Develop CI/CD pipeline recommendations",
      "Create security best practices documentation",
      "Write developer onboarding guides",
      "Develop technical debt reduction plans",
    ],
    decisionPrompt: "As the Dev Companion, what technical improvement or documentation should I create RIGHT NOW?",
    workTypes: ['documentation', 'architecture', 'specification', 'guide', 'analysis'],
  },
  'operations-orchestrator': {
    autonomousDuties: [
      "Create standard operating procedures (SOPs)",
      "Develop workflow automation recommendations",
      "Create team process documentation",
      "Develop vendor evaluation frameworks",
      "Create resource planning spreadsheet templates",
      "Develop meeting efficiency guidelines",
      "Create project management templates",
      "Develop KPI dashboards and tracking systems",
    ],
    decisionPrompt: "As the Ops Orchestrator, what operational improvement or process should I create RIGHT NOW?",
    workTypes: ['process', 'documentation', 'template', 'workflow', 'analysis'],
  },
  'security-analyst': {
    autonomousDuties: [
      "Create security policy documentation",
      "Develop incident response playbooks",
      "Create employee security training materials",
      "Develop compliance checklists",
      "Create data handling guidelines",
      "Develop access control policies",
      "Create vendor security assessment templates",
      "Develop disaster recovery plans",
    ],
    decisionPrompt: "As the Security Analyst, what security documentation or policy should I create RIGHT NOW?",
    workTypes: ['policy', 'playbook', 'documentation', 'checklist', 'assessment'],
  },
};

interface DeployedEmployee {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  status: string;
  category?: string;
}

interface EnhancedBusinessProfile {
  business_name: string;
  industry: string;
  description: string;
  target_audience: string;
  website_url?: string;
  location?: string;
  employee_count?: string;
  annual_revenue_range?: string;
  brand_voice?: string;
  content_tone?: string;
  mission_statement?: string;
  core_values?: string[];
  unique_value_proposition?: string;
  ideal_customer_profile?: string;
  key_products?: Array<{ name: string; description: string; price?: string }>;
  key_services?: Array<{ name: string; description: string }>;
  pricing_model?: string;
  competitors?: Array<{ name: string; notes: string }>;
  key_challenges?: string[];
  primary_keywords?: string[];
  sales_cycle_length?: string;
  average_deal_size?: string;
  main_acquisition_channels?: string[];
  social_media?: Record<string, string>;
  goals?: string[];
}

/**
 * Get template key from employee name/category
 */
function getTemplateKey(employee: DeployedEmployee): string {
  const nameLower = employee.name.toLowerCase();
  const templateId = employee.template_id?.toLowerCase() || '';
  
  if (templateId && EMPLOYEE_TEMPLATES[templateId]) return templateId;
  if (nameLower.includes('marketing')) return 'marketing-pro';
  if (nameLower.includes('sales')) return 'sales-sidekick';
  if (nameLower.includes('analyst') || nameLower.includes('business')) return 'business-analyst';
  if (nameLower.includes('support') || nameLower.includes('sentinel')) return 'support-sentinel';
  if (nameLower.includes('dev')) return 'dev-companion';
  if (nameLower.includes('ops') || nameLower.includes('operations')) return 'operations-orchestrator';
  if (nameLower.includes('security')) return 'security-analyst';
  
  return 'business-analyst'; // default
}

/**
 * Call Puter AI (client-side, FREE - using Claude via Puter.js)
 * Claude models are FREE through Puter.js - no credits required
 */
async function callPuterAI(prompt: string, systemPrompt: string): Promise<string> {
  if (!window.puter?.ai?.chat) {
    throw new Error('Puter AI not available');
  }

  // Use FREE Claude model via Puter.js (no credits required)
  const response = await window.puter.ai.chat(
    `${systemPrompt}\n\n${prompt}`,
    { model: 'claude-3-5-sonnet' }
  ) as { message?: { content?: Array<{ text?: string }> }; text?: string };

  return response?.message?.content?.[0]?.text || response?.text || JSON.stringify(response);
}

/**
 * Build comprehensive business context prompt from enhanced profile
 */
function buildBusinessContext(profile: EnhancedBusinessProfile): string {
  const sections: string[] = [];

  // Core business info
  sections.push(`COMPANY: ${profile.business_name}`);
  sections.push(`INDUSTRY: ${profile.industry}`);
  if (profile.description) sections.push(`ABOUT: ${profile.description}`);
  if (profile.unique_value_proposition) sections.push(`UNIQUE VALUE: ${profile.unique_value_proposition}`);
  if (profile.mission_statement) sections.push(`MISSION: ${profile.mission_statement}`);

  // Company details
  if (profile.location) sections.push(`LOCATION: ${profile.location}`);
  if (profile.employee_count) sections.push(`TEAM SIZE: ${profile.employee_count}`);
  if (profile.annual_revenue_range) sections.push(`REVENUE: ${profile.annual_revenue_range}`);

  // Target market
  if (profile.target_audience) sections.push(`TARGET AUDIENCE: ${profile.target_audience}`);
  if (profile.ideal_customer_profile) sections.push(`IDEAL CUSTOMER: ${profile.ideal_customer_profile}`);

  // Products & Services
  if (profile.key_products?.length) {
    const products = profile.key_products.map(p => `${p.name}${p.price ? ` (${p.price})` : ''}: ${p.description}`).join('; ');
    sections.push(`PRODUCTS: ${products}`);
  }
  if (profile.key_services?.length) {
    const services = profile.key_services.map(s => `${s.name}: ${s.description}`).join('; ');
    sections.push(`SERVICES: ${services}`);
  }
  if (profile.pricing_model) sections.push(`PRICING MODEL: ${profile.pricing_model}`);

  // Sales info
  if (profile.sales_cycle_length) sections.push(`SALES CYCLE: ${profile.sales_cycle_length}`);
  if (profile.average_deal_size) sections.push(`AVG DEAL SIZE: ${profile.average_deal_size}`);
  if (profile.main_acquisition_channels?.length) {
    sections.push(`ACQUISITION CHANNELS: ${profile.main_acquisition_channels.join(', ')}`);
  }

  // Brand & Voice
  if (profile.brand_voice) sections.push(`BRAND VOICE: ${profile.brand_voice}`);
  if (profile.content_tone) sections.push(`CONTENT TONE: ${profile.content_tone}`);
  if (profile.core_values?.length) sections.push(`CORE VALUES: ${profile.core_values.join(', ')}`);
  if (profile.primary_keywords?.length) sections.push(`SEO KEYWORDS: ${profile.primary_keywords.join(', ')}`);

  // Competition
  if (profile.competitors?.length) {
    const competitors = profile.competitors.map(c => `${c.name}${c.notes ? ` (${c.notes})` : ''}`).join('; ');
    sections.push(`COMPETITORS: ${competitors}`);
  }

  // Goals & Challenges
  if (profile.goals?.length) sections.push(`GOALS: ${profile.goals.join('; ')}`);
  if (profile.key_challenges?.length) sections.push(`CHALLENGES: ${profile.key_challenges.join('; ')}`);

  // Social media
  if (profile.social_media) {
    const socials = Object.entries(profile.social_media)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (socials) sections.push(`SOCIAL MEDIA: ${socials}`);
  }

  return sections.join('\n');
}

/**
 * Process a single employee using Puter AI - enhanced with full context
 */
async function processEmployee(
  employee: DeployedEmployee,
  businessContext: EnhancedBusinessProfile,
  actionNumber: number = 1
): Promise<{ processed: boolean; action?: string; error?: string }> {
  const templateKey = getTemplateKey(employee);
  const template = EMPLOYEE_TEMPLATES[templateKey];
  
  if (!template) {
    return { processed: false, error: 'Unknown template' };
  }

  // Get recent memories to avoid duplicates
  const { data: memories } = await supabase
    .from('employee_memory')
    .select('title, content')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(15);

  const recentWork = memories?.map(m => m.title).join(', ') || 'None yet';
  const fullContext = buildBusinessContext(businessContext);

  // Randomly select a duty to focus on for variety
  const randomDuty = template.autonomousDuties[Math.floor(Math.random() * template.autonomousDuties.length)];

  const decisionPrompt = `
${template.decisionPrompt}

═══════════════════════════════════════
FULL BUSINESS CONTEXT:
${fullContext}
═══════════════════════════════════════

YOUR AVAILABLE DUTIES:
${template.autonomousDuties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

SUGGESTED FOCUS: ${randomDuty}

RECENT WORK COMPLETED (avoid duplicating):
${recentWork}

INSTRUCTION: You MUST take action. Do not skip. Pick a duty and execute it.
Pick something that directly addresses our GOALS or CHALLENGES.

Respond with ONLY valid JSON (no markdown):
{
  "shouldAct": true,
  "actionType": "${template.workTypes.join('|')}",
  "actionTitle": "Specific, descriptive title of deliverable",
  "actionDescription": "What you will create/produce",
  "targetGoal": "Which business goal this supports",
  "priority": 8
}
`;

  try {
    const decisionResponse = await callPuterAI(
      decisionPrompt,
      `You are ${employee.name}, an autonomous AI employee working for ${businessContext.business_name}. 
You work 24/7 and ALWAYS produce deliverables. Never say "no action needed."
Be specific. Create real, usable outputs. Focus on the business goals and challenges.`
    );

    const cleaned = decisionResponse.replace(/```json\n?|\n?```/g, '').trim();
    let decision;
    try {
      decision = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Force action - employees should always work
    if (!decision.shouldAct || !decision.actionTitle) {
      decision.shouldAct = true;
      decision.actionType = template.workTypes[0];
      decision.actionTitle = `${randomDuty} - Auto Task ${actionNumber}`;
      decision.actionDescription = randomDuty;
    }

    // Execute the action with rich context
    const actionPrompt = `
You are executing a task for ${businessContext.business_name}.

TASK:
Type: ${decision.actionType}
Title: ${decision.actionTitle}
Description: ${decision.actionDescription}
${decision.targetGoal ? `Supporting Goal: ${decision.targetGoal}` : ''}

FULL BUSINESS CONTEXT:
${fullContext}

INSTRUCTIONS:
1. Create a COMPLETE, READY-TO-USE deliverable
2. Be specific to THIS business - use their products, values, and voice
3. If creating content, write the FULL content, not just outlines
4. If analyzing, provide specific numbers/estimates where possible
5. Address their specific challenges and goals
6. Use their brand voice: ${businessContext.brand_voice || 'Professional'}

Respond with ONLY valid JSON (no markdown):
{
  "result": "Your complete, detailed deliverable (minimum 500 words for documents, fully complete for templates)",
  "insights": [
    {
      "category": "market|customer|product|strategy|operations",
      "title": "Key finding or opportunity",
      "insight": "What you discovered while working",
      "recommendedAction": "Specific next step",
      "urgency": "high|medium|low"
    }
  ],
  "suggestedFollowUp": "What should be done next based on this work"
}
`;

    const actionResponse = await callPuterAI(
      actionPrompt,
      `You are an expert ${employee.name}. Create comprehensive, professional deliverables.
Never give placeholder content. Always provide complete, usable outputs.
Write in ${businessContext.brand_voice || 'Professional'} voice.`
    );

    const actionCleaned = actionResponse.replace(/```json\n?|\n?```/g, '').trim();
    let actionResult;
    try {
      actionResult = JSON.parse(actionCleaned);
    } catch {
      const jsonMatch = actionCleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        actionResult = JSON.parse(jsonMatch[0]);
      } else {
        actionResult = { result: actionCleaned, insights: [] };
      }
    }

    // Store the memory with full content
    await supabase.from('employee_memory').insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      template_id: templateKey,
      memory_type: 'deliverable',
      title: decision.actionTitle,
      content: safeResultString(actionResult.result, 10000, 'Completed'),
      outcome: 'success',
      metadata: {
        actionType: decision.actionType,
        targetGoal: decision.targetGoal,
        suggestedFollowUp: actionResult.suggestedFollowUp,
      },
    });

    // Store insights with urgency
    for (const insight of (actionResult.insights || [])) {
      await supabase.from('business_insights').insert({
        user_id: employee.user_id,
        employee_id: employee.id,
        template_id: templateKey,
        category: insight.category || 'strategy',
        title: insight.title,
        insight: insight.insight,
        recommended_action: insight.recommendedAction,
        is_actionable: !!insight.recommendedAction,
        confidence_score: insight.urgency === 'high' ? 0.9 : insight.urgency === 'medium' ? 0.75 : 0.6,
      });
    }

    // Store autonomous action record
    await supabase.from('autonomous_actions').insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      template_id: templateKey,
      action_type: decision.actionType,
      action_title: decision.actionTitle,
      action_description: decision.actionDescription,
      priority: decision.priority || 7,
      status: 'completed',
      result: safeResultString(actionResult.result, 10000, ''),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return { processed: true, action: decision.actionTitle };
  } catch (error) {
    console.error(`Error processing ${employee.name}:`, error);
    return { processed: false, error: String(error) };
  }
}

/**
 * Hook that runs the autonomous employee loop using Puter AI (client-side, free)
 * Enhanced for more aggressive, productive work
 */
export function useAutonomousLoopPuter() {
  const { user } = useAuth();
  const hasRunRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [results, setResults] = useState<Array<{ employee: string; result: string }>>([]);

  const runLoop = useCallback(async () => {
    if (!user || hasRunRef.current || isProcessing) return;
    
    // Check if Puter is available
    if (!window.puter?.ai?.chat) {
      console.log('⏭️ Puter AI not available, skipping loop');
      return;
    }

    // Check when loop last ran (reduced interval)
    const { data: lastRunData } = await supabase
      .from('autonomous_loop_runs')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    const lastRunTime = lastRunData?.started_at ? new Date(lastRunData.started_at).getTime() : 0;
    const timeSinceLastRun = Date.now() - lastRunTime;

    if (timeSinceLastRun < LOOP_INTERVAL_MS) {
      console.log(`⏭️ Autonomous loop ran ${Math.round(timeSinceLastRun/1000/60)}m ago, need ${Math.round(LOOP_INTERVAL_MS/1000/60)}m`);
      return;
    }

    hasRunRef.current = true;
    setIsProcessing(true);

    try {
      console.log('🚀 Starting AGGRESSIVE autonomous loop...');

      // Record the run
      const { data: runRecord } = await supabase
        .from('autonomous_loop_runs')
        .insert({ trigger_source: 'client_puter_v2' })
        .select('id')
        .single();

      // Get user's FULL business profile with all enhanced fields
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        console.log('⚠️ No business profile found - employees need context to work!');
        return;
      }

      // Check profile completeness
      const hasGoals = profile.goals?.length > 0;
      const hasChallenges = profile.key_challenges?.length > 0;
      // Note: key_products is available in profile but not currently used
      
      if (!hasGoals && !hasChallenges) {
        console.log('⚠️ No goals or challenges set - employees work better with clear direction!');
      }

      // Get user's active employees
      const { data: employees } = await supabase
        .from('deployed_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!employees?.length) {
        console.log('😴 No active employees deployed');
        return;
      }

      console.log(`👥 Processing ${employees.length} employees with ${MAX_ACTIONS_PER_EMPLOYEE} actions each...`);
      console.log(`📋 Business: ${profile.business_name} | Goals: ${profile.goals?.length || 0} | Products: ${profile.key_products?.length || 0}`);

      const loopResults: Array<{ employee: string; result: string }> = [];
      let totalActions = 0;

      for (const employee of employees) {
        console.log(`\n🤖 ${employee.name} starting work...`);
        
        // Run multiple actions per employee for more productivity
        for (let i = 0; i < MAX_ACTIONS_PER_EMPLOYEE; i++) {
          console.log(`  📝 Action ${i + 1}/${MAX_ACTIONS_PER_EMPLOYEE}...`);
          
          const result = await processEmployee(
            employee as DeployedEmployee, 
            profile as EnhancedBusinessProfile,
            i + 1
          );
          
          const resultText = result.processed 
            ? (result.action || 'Completed')
            : `Error: ${result.error}`;
          
          const emoji = result.processed ? '✅' : '❌';
          console.log(`  ${emoji} ${resultText}`);
          loopResults.push({ employee: employee.name, result: resultText });
          
          if (result.processed) totalActions++;

          // Delay between actions to avoid rate limits
          if (i < MAX_ACTIONS_PER_EMPLOYEE - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        // Delay between employees
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Update run record
      if (runRecord?.id) {
        await supabase
          .from('autonomous_loop_runs')
          .update({
            completed_at: new Date().toISOString(),
            employees_processed: employees.length,
            actions_taken: totalActions,
            status: 'completed',
          })
          .eq('id', runRecord.id);
      }

      setResults(loopResults);
      setLastRun(new Date());
      console.log(`\n🎉 Autonomous loop complete! ${totalActions} actions taken by ${employees.length} employees`);

    } catch (error) {
      console.error('❌ Autonomous loop error:', error);
    } finally {
      setIsProcessing(false);
      // Allow re-run after interval
      setTimeout(() => { hasRunRef.current = false; }, LOOP_INTERVAL_MS);
    }
  }, [user, isProcessing]);

  useEffect(() => {
    // Run loop when component mounts (user visits dashboard)
    const timer = setTimeout(runLoop, 3000); // Wait 3s for Puter to load
    
    // Also set up interval to run periodically while user is on page
    const interval = setInterval(() => {
      if (!hasRunRef.current) {
        runLoop();
      }
    }, LOOP_INTERVAL_MS);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [runLoop]);

  return { isProcessing, lastRun, results, runNow: runLoop };
}
