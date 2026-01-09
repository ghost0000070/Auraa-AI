import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/hooks/useAuth';

const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Employee template configurations
const EMPLOYEE_TEMPLATES: Record<string, { autonomousDuties: string[]; decisionPrompt: string }> = {
  'marketing-pro': {
    autonomousDuties: [
      "Research competitor marketing strategies",
      "Analyze target audience and suggest content themes",
      "Generate social media content ideas",
      "Review brand messaging and suggest improvements",
    ],
    decisionPrompt: "As the Marketing Pro, what marketing opportunity should I pursue right now?",
  },
  'sales-sidekick': {
    autonomousDuties: [
      "Research ideal customer profiles",
      "Develop sales pitch variations",
      "Analyze common objections and create responses",
      "Identify partnership opportunities",
    ],
    decisionPrompt: "As the Sales Sidekick, what sales action should I take right now?",
  },
  'business-analyst': {
    autonomousDuties: [
      "Research industry benchmarks",
      "Identify key metrics to track",
      "Analyze market trends",
      "Create strategic recommendations",
    ],
    decisionPrompt: "As the Business Analyst, what strategic insight should I develop right now?",
  },
  'support-sentinel': {
    autonomousDuties: [
      "Analyze common customer pain points",
      "Create FAQ content",
      "Develop customer onboarding guides",
      "Suggest process improvements",
    ],
    decisionPrompt: "As the Support Sentinel, what customer experience improvement should I work on?",
  },
  'dev-companion': {
    autonomousDuties: [
      "Research technology improvements",
      "Identify automation opportunities",
      "Suggest architecture improvements",
      "Create technical documentation",
    ],
    decisionPrompt: "As the Dev Companion, what technical improvement should I research?",
  },
  'operations-orchestrator': {
    autonomousDuties: [
      "Research operational best practices",
      "Identify process bottlenecks",
      "Create standard operating procedures",
      "Analyze resource allocation",
    ],
    decisionPrompt: "As the Ops Orchestrator, what operational improvement should I work on?",
  },
  'security-analyst': {
    autonomousDuties: [
      "Research security best practices",
      "Identify compliance requirements",
      "Develop security policies",
      "Create incident response playbooks",
    ],
    decisionPrompt: "As the Security Analyst, what security improvement should I research?",
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

interface BusinessProfile {
  business_name: string;
  industry: string;
  description: string;
  target_audience: string;
  website_url?: string;
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
 * Call Puter AI (client-side, free)
 */
async function callPuterAI(prompt: string, systemPrompt: string): Promise<string> {
  const puter = (window as any).puter;
  
  if (!puter?.ai?.chat) {
    throw new Error('Puter AI not available');
  }

  const response = await puter.ai.chat(
    `${systemPrompt}\n\n${prompt}`,
    { model: 'claude-sonnet-4-5' }
  );

  return response?.message?.content?.[0]?.text || response?.text || JSON.stringify(response);
}

/**
 * Process a single employee using Puter AI
 */
async function processEmployee(
  employee: DeployedEmployee,
  businessContext: BusinessProfile
): Promise<{ processed: boolean; action?: string; error?: string }> {
  const templateKey = getTemplateKey(employee);
  const template = EMPLOYEE_TEMPLATES[templateKey];
  
  if (!template) {
    return { processed: false, error: 'Unknown template' };
  }

  // Get recent memories to avoid duplicates
  const { data: memories } = await supabase
    .from('employee_memory')
    .select('title')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const recentWork = memories?.map(m => m.title).join(', ') || 'None';

  const decisionPrompt = `
${template.decisionPrompt}

BUSINESS: ${businessContext.business_name} (${businessContext.industry})
DESCRIPTION: ${businessContext.description || 'N/A'}
TARGET AUDIENCE: ${businessContext.target_audience || 'N/A'}
${businessContext.goals?.length ? `GOALS: ${businessContext.goals.join(', ')}` : ''}

YOUR DUTIES:
${template.autonomousDuties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

RECENT WORK (avoid duplicating): ${recentWork}

Respond with ONLY valid JSON:
{"shouldAct": true/false, "actionType": "research|analyze|recommend|create", "actionTitle": "Brief title", "actionDescription": "What you will do", "priority": 1-10}
`;

  try {
    const decisionResponse = await callPuterAI(
      decisionPrompt,
      `You are ${employee.name}, an autonomous AI employee. Be concise.`
    );

    const cleaned = decisionResponse.replace(/```json\n?|\n?```/g, '').trim();
    const decision = JSON.parse(cleaned);

    if (!decision.shouldAct) {
      return { processed: true, action: 'No action needed' };
    }

    // Execute the action
    const actionPrompt = `
Execute this action for ${businessContext.business_name}:
Type: ${decision.actionType}
Title: ${decision.actionTitle}
Description: ${decision.actionDescription}

Provide real, specific, actionable output. Be thorough but concise.

Respond with ONLY valid JSON:
{"result": "Your detailed work output", "insights": [{"category": "market|customer|product|strategy", "title": "Insight title", "insight": "What you discovered", "recommendedAction": "What to do"}]}
`;

    const actionResponse = await callPuterAI(
      actionPrompt,
      `You are an expert ${employee.name}. Provide valuable, specific insights.`
    );

    const actionCleaned = actionResponse.replace(/```json\n?|\n?```/g, '').trim();
    const actionResult = JSON.parse(actionCleaned);

    // Store the memory
    await supabase.from('employee_memory').insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      template_id: templateKey,
      memory_type: 'action',
      title: decision.actionTitle,
      content: actionResult.result?.substring(0, 5000) || 'Action completed',
      outcome: 'success',
    });

    // Store insights
    for (const insight of (actionResult.insights || [])) {
      await supabase.from('business_insights').insert({
        user_id: employee.user_id,
        employee_id: employee.id,
        template_id: templateKey,
        category: insight.category,
        title: insight.title,
        insight: insight.insight,
        recommended_action: insight.recommendedAction,
        is_actionable: !!insight.recommendedAction,
        confidence_score: 0.75,
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
      priority: decision.priority || 5,
      status: 'completed',
      result: actionResult.result?.substring(0, 5000),
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
    const puter = (window as any).puter;
    if (!puter?.ai?.chat) {
      console.log('⏭️ Puter AI not available, skipping loop');
      return;
    }

    // Check when loop last ran
    const { data: lastRunData } = await supabase
      .from('autonomous_loop_runs')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    const lastRunTime = lastRunData?.started_at ? new Date(lastRunData.started_at).getTime() : 0;
    const timeSinceLastRun = Date.now() - lastRunTime;

    if (timeSinceLastRun < LOOP_INTERVAL_MS) {
      console.log('⏭️ Autonomous loop recently ran, skipping');
      return;
    }

    hasRunRef.current = true;
    setIsProcessing(true);

    try {
      console.log('🔄 Starting Puter-powered autonomous loop...');

      // Record the run
      const { data: runRecord } = await supabase
        .from('autonomous_loop_runs')
        .insert({ trigger_source: 'client_puter' })
        .select('id')
        .single();

      // Get user's business profile
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        console.log('⚠️ No business profile, skipping');
        return;
      }

      // Get user's active employees
      const { data: employees } = await supabase
        .from('deployed_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!employees?.length) {
        console.log('😴 No active employees');
        return;
      }

      console.log(`👥 Processing ${employees.length} employees...`);

      const loopResults: Array<{ employee: string; result: string }> = [];

      for (const employee of employees) {
        console.log(`🤖 Processing ${employee.name}...`);
        const result = await processEmployee(employee as DeployedEmployee, profile as BusinessProfile);
        
        const resultText = result.processed 
          ? (result.action || 'Completed')
          : `Error: ${result.error}`;
        
        console.log(`${result.processed ? '✅' : '❌'} ${employee.name}: ${resultText}`);
        loopResults.push({ employee: employee.name, result: resultText });

        // Small delay between employees
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Update run record
      if (runRecord?.id) {
        await supabase
          .from('autonomous_loop_runs')
          .update({
            completed_at: new Date().toISOString(),
            employees_processed: loopResults.length,
            actions_taken: loopResults.filter(r => !r.result.startsWith('Error')).length,
            status: 'completed',
          })
          .eq('id', runRecord.id);
      }

      setResults(loopResults);
      setLastRun(new Date());
      console.log('✅ Autonomous loop complete!');

    } catch (error) {
      console.error('❌ Autonomous loop error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing]);

  useEffect(() => {
    // Run loop when component mounts (user visits dashboard)
    const timer = setTimeout(runLoop, 3000); // Wait 3s for Puter to load
    return () => clearTimeout(timer);
  }, [runLoop]);

  return { isProcessing, lastRun, results };
}
