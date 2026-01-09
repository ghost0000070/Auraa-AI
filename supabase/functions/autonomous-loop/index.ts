/**
 * Autonomous Loop Edge Function
 * 
 * Called every 5 minutes by Vercel Cron to process all active employees.
 * Each employee decides what to do based on their role and business context.
 * 
 * Fully automated - users just hire employees, employees just work.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Employee template configurations
const EMPLOYEE_TEMPLATES: Record<string, { autonomousDuties: string[]; decisionPrompt: string }> = {
  'marketing-pro': {
    autonomousDuties: [
      "Research competitor marketing strategies and identify gaps we can exploit",
      "Analyze our target audience and suggest content themes that resonate",
      "Generate social media content ideas based on trending topics in our industry",
      "Review our brand messaging and suggest improvements for better conversion",
      "Identify untapped marketing channels suitable for our business",
      "Create campaign concepts for upcoming seasons or events",
      "Analyze what makes successful businesses in our industry stand out",
    ],
    decisionPrompt: "As the Marketing Pro, analyze the business profile and determine: What marketing opportunity should I pursue right now to grow this business?",
  },
  'sales-sidekick': {
    autonomousDuties: [
      "Research ideal customer profiles and identify new market segments",
      "Develop sales pitch variations for different buyer personas",
      "Analyze common objections and create response strategies",
      "Identify partnership opportunities with complementary businesses",
      "Create outreach templates for different stages of the sales cycle",
      "Research pricing strategies used by successful competitors",
      "Generate lead qualification criteria based on business goals",
    ],
    decisionPrompt: "As the Sales Sidekick, analyze the business profile and determine: What sales action should I take right now to increase revenue?",
  },
  'support-sentinel': {
    autonomousDuties: [
      "Analyze common customer pain points and suggest product improvements",
      "Create FAQ content based on frequently asked questions",
      "Develop customer onboarding guides and tutorials",
      "Identify at-risk customers based on support patterns",
      "Research best practices for customer retention in our industry",
      "Create response templates for common scenarios",
      "Suggest process improvements to reduce support volume",
    ],
    decisionPrompt: "As the Support Sentinel, analyze the business profile and determine: What customer experience improvement should I work on right now?",
  },
  'business-analyst': {
    autonomousDuties: [
      "Research industry benchmarks and compare our business performance",
      "Identify key metrics we should be tracking based on our goals",
      "Analyze market trends affecting our industry",
      "Create strategic recommendations for business growth",
      "Research successful business models in similar industries",
      "Identify operational inefficiencies and cost-saving opportunities",
      "Develop KPI frameworks for measuring business health",
    ],
    decisionPrompt: "As the Business Analyst, analyze the business profile and determine: What strategic insight should I develop right now to help leadership make better decisions?",
  },
  'dev-companion': {
    autonomousDuties: [
      "Research technology stack improvements for better performance",
      "Identify automation opportunities in development workflows",
      "Suggest architecture improvements based on best practices",
      "Create technical documentation templates",
      "Research emerging technologies relevant to our business",
      "Develop coding standards and guidelines",
      "Identify potential technical debt and remediation strategies",
    ],
    decisionPrompt: "As the Dev Companion, analyze the business profile and determine: What technical improvement should I research or document right now to help the business scale?",
  },
  'operations-orchestrator': {
    autonomousDuties: [
      "Research operational best practices for our industry",
      "Identify process bottlenecks and suggest improvements",
      "Create standard operating procedures for key workflows",
      "Research vendor options for common business needs",
      "Develop risk management frameworks",
      "Analyze resource allocation and optimization opportunities",
      "Create project templates for recurring initiatives",
    ],
    decisionPrompt: "As the Ops Orchestrator, analyze the business profile and determine: What operational improvement should I work on right now to make the business run more efficiently?",
  },
  'security-analyst': {
    autonomousDuties: [
      "Research security best practices for our industry",
      "Identify compliance requirements and create checklists",
      "Develop security policies and guidelines",
      "Research common threats targeting businesses like ours",
      "Create incident response playbooks",
      "Analyze data privacy requirements and recommendations",
      "Suggest security tools and practices for our tech stack",
    ],
    decisionPrompt: "As the Security Analyst, analyze the business profile and determine: What security improvement should I research or document right now to protect the business?",
  },
  'ai-team-orchestrator': {
    autonomousDuties: [
      "Analyze how all employees can work together more effectively",
      "Identify tasks that require cross-functional collaboration",
      "Review employee outputs and suggest quality improvements",
      "Develop strategic initiatives that leverage multiple employees",
      "Create workflows for complex multi-step business processes",
      "Monitor overall team performance and suggest optimizations",
      "Delegate research tasks to appropriate specialized employees",
    ],
    decisionPrompt: "As the AI Team Orchestrator, analyze the business profile and all active employees to determine: What strategic initiative should I coordinate right now that leverages multiple team members?",
  },
};

interface DeployedEmployee {
  id: string;
  user_id: string;
  name: string;
  template_id: string; // UUID stored as string
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
 * Call Puter AI API for autonomous decisions
 */
async function callPuterAI(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.puter.com/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Puter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content?.[0]?.text || data.text || JSON.stringify(data);
}

/**
 * Map employee name/category to template key
 */
function getTemplateKey(employee: DeployedEmployee): string | null {
  const nameLower = employee.name.toLowerCase();
  const categoryLower = (employee.category || '').toLowerCase();
  
  // Map based on name keywords or category
  if (nameLower.includes('marketing') || categoryLower.includes('marketing')) return 'marketing-pro';
  if (nameLower.includes('sales') || categoryLower.includes('sales')) return 'sales-sidekick';
  if (nameLower.includes('support') || nameLower.includes('sentinel') || categoryLower.includes('support')) return 'support-sentinel';
  if (nameLower.includes('analyst') || nameLower.includes('business') || categoryLower.includes('analytics')) return 'business-analyst';
  if (nameLower.includes('dev') || nameLower.includes('developer') || categoryLower.includes('development')) return 'dev-companion';
  if (nameLower.includes('ops') || nameLower.includes('operations') || nameLower.includes('orchestrator') && !nameLower.includes('team')) return 'operations-orchestrator';
  if (nameLower.includes('security') || categoryLower.includes('security')) return 'security-analyst';
  if (nameLower.includes('team') || nameLower.includes('orchestrator') || categoryLower.includes('coordination')) return 'ai-team-orchestrator';
  
  // Default to business analyst if we can't determine
  return 'business-analyst';
}

/**
 * Process a single employee
 */
async function processEmployee(
  supabase: ReturnType<typeof createClient>,
  employee: DeployedEmployee,
  businessContext: BusinessProfile
): Promise<{ processed: boolean; action?: string; error?: string }> {
  const templateKey = getTemplateKey(employee);
  const template = templateKey ? EMPLOYEE_TEMPLATES[templateKey] : null;
  
  if (!template) {
    return { processed: false, error: `Could not determine template for: ${employee.name}` };
  }

  // Get employee's recent memories to avoid duplicates
  const { data: memories } = await supabase
    .from('employee_memory')
    .select('memory_type, title, content, created_at')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(15);

  // Get known business insights
  const { data: insights } = await supabase
    .from('business_insights')
    .select('category, title, insight')
    .eq('user_id', employee.user_id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Ask the employee what they should do
  const decisionPrompt = `
${template.decisionPrompt}

=== BUSINESS PROFILE ===
Company: ${businessContext.business_name}
Industry: ${businessContext.industry}
Description: ${businessContext.description || 'Not provided'}
Target Audience: ${businessContext.target_audience || 'Not specified'}
${businessContext.website_url ? `Website: ${businessContext.website_url}` : ''}
${businessContext.goals?.length ? `Goals: ${businessContext.goals.join(', ')}` : ''}

=== YOUR AUTONOMOUS DUTIES ===
${template.autonomousDuties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

=== YOUR RECENT WORK (avoid duplicating) ===
${memories?.length ? memories.slice(0, 10).map(m => `- [${m.memory_type}] ${m.title}`).join('\n') : 'No recent work - fresh start!'}

=== KNOWN BUSINESS INSIGHTS ===
${insights?.length ? insights.slice(0, 10).map(i => `- [${i.category}] ${i.insight.substring(0, 100)}...`).join('\n') : 'No insights yet - time to learn!'}

Should you take action right now? If yes, what specific action from your duties best serves the business?

Respond with ONLY JSON (no markdown):
{
  "shouldAct": true/false,
  "actionType": "research|create_content|analyze|recommend|delegate|learn",
  "actionTitle": "Brief title",
  "actionDescription": "What you will do",
  "reasoning": "Why this helps the business",
  "priority": 1-10
}
`;

  try {
    const decisionResponse = await callPuterAI(
      decisionPrompt,
      `You are ${employee.name}, an autonomous AI employee. Respond with valid JSON only.`
    );

    const cleaned = decisionResponse.replace(/```json\n?|\n?```/g, '').trim();
    const decision = JSON.parse(cleaned);

    if (!decision.shouldAct) {
      return { processed: true, action: 'No action needed' };
    }

    // Execute the action
    const actionPrompt = `
You are ${employee.name} executing an autonomous action.

=== YOUR ACTION ===
Type: ${decision.actionType}
Title: ${decision.actionTitle}
Description: ${decision.actionDescription}

=== BUSINESS CONTEXT ===
Company: ${businessContext.business_name}
Industry: ${businessContext.industry}
Description: ${businessContext.description || 'N/A'}
Target Audience: ${businessContext.target_audience || 'N/A'}
${businessContext.goals?.length ? `Goals: ${businessContext.goals.join(', ')}` : ''}

Execute this thoroughly. Provide real, actionable value specific to this business.

Respond with ONLY JSON:
{
  "result": "Your detailed work output",
  "insights": [
    {
      "category": "market|competitor|customer|product|operations|strategy",
      "title": "Insight title",
      "insight": "What you discovered",
      "recommendedAction": "What to do about it"
    }
  ]
}
`;

    const actionResponse = await callPuterAI(
      actionPrompt,
      `You are an expert ${employee.name}. Be thorough and valuable.`
    );

    const actionCleaned = actionResponse.replace(/```json\n?|\n?```/g, '').trim();
    const actionResult = JSON.parse(actionCleaned);

    // Store the memory
    await supabase.from('employee_memory').insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      template_id: employee.template_id,
      memory_type: 'action',
      title: decision.actionTitle,
      content: actionResult.result?.substring(0, 5000) || 'Action completed',
      outcome: 'success',
    });

    // Store any insights discovered
    for (const insight of (actionResult.insights || [])) {
      await supabase.from('business_insights').insert({
        user_id: employee.user_id,
        employee_id: employee.id,
        template_id: employee.template_id,
        category: insight.category,
        title: insight.title,
        insight: insight.insight,
        recommended_action: insight.recommendedAction,
        is_actionable: !!insight.recommendedAction,
        confidence_score: 0.75,
      });
    }

    // Store the autonomous action record
    await supabase.from('autonomous_actions').insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      template_id: employee.template_id,
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is a legitimate cron call (optional security)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also allow service role key for manual testing
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!authHeader?.includes(supabaseServiceKey || '')) {
        console.log('Unauthorized cron attempt');
        // Don't block - allow through for now
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 AUTONOMOUS LOOP STARTED -', new Date().toISOString());

    // Get all active deployed employees from deployed_employees table
    const { data: employees, error: employeesError } = await supabase
      .from('deployed_employees')
      .select('id, user_id, name, template_id, status, category')
      .eq('status', 'active');

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      console.log('😴 No active employees');
      return new Response(
        JSON.stringify({ success: true, message: 'No active employees', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 Found ${employees.length} active employees`);

    // Group employees by user to batch business context fetches
    const employeesByUser = new Map<string, DeployedEmployee[]>();
    for (const emp of employees) {
      const list = employeesByUser.get(emp.user_id) || [];
      list.push(emp as DeployedEmployee);
      employeesByUser.set(emp.user_id, list);
    }

    const results: Array<{ employee: string; result: string }> = [];

    // Process each user's employees
    for (const [userId, userEmployees] of employeesByUser) {
      // Get business context for this user
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!businessProfile) {
        console.log(`⚠️ No business profile for user ${userId}, skipping ${userEmployees.length} employees`);
        for (const emp of userEmployees) {
          results.push({ employee: emp.name, result: 'Skipped - no business profile' });
        }
        continue;
      }

      // Process each employee for this user
      for (const employee of userEmployees) {
        console.log(`🤖 Processing ${employee.name}...`);
        
        const result = await processEmployee(supabase, employee, businessProfile as BusinessProfile);
        
        if (result.processed) {
          console.log(`✅ ${employee.name}: ${result.action}`);
          results.push({ employee: employee.name, result: result.action || 'Completed' });
        } else {
          console.log(`❌ ${employee.name}: ${result.error}`);
          results.push({ employee: employee.name, result: `Error: ${result.error}` });
        }

        // Small delay between employees to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ AUTONOMOUS LOOP COMPLETE');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Autonomous loop error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
