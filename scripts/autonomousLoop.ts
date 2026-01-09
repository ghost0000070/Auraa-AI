/**
 * Autonomous Agent Loop
 * 
 * This background service cycles through all deployed employees every 5 minutes
 * and asks each one: "What should you do right now?"
 * 
 * Employees make autonomous decisions based on:
 * - Their role and expertise (from template)
 * - The business context (from business_profiles)
 * - Their memory (past actions and learnings)
 * - Business insights (discovered knowledge)
 * 
 * No scheduling required - employees just know what to do.
 * 
 * Run with: npx tsx scripts/autonomousLoop.ts
 */

import { createClient } from '@supabase/supabase-js';

// Get the templates (we'll load them dynamically for server environment)
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
        decisionPrompt: "As the Marketing Pro, analyze the business profile and determine: What marketing opportunity should I pursue right now to grow this business? Consider content gaps, audience engagement opportunities, and competitive advantages.",
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
        decisionPrompt: "As the Sales Sidekick, analyze the business profile and determine: What sales action should I take right now to increase revenue? Consider lead generation, pitch optimization, and closing strategies.",
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
        decisionPrompt: "As the Support Sentinel, analyze the business profile and determine: What customer experience improvement should I work on right now? Consider FAQ gaps, onboarding friction, and retention opportunities.",
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
        decisionPrompt: "As the Business Analyst, analyze the business profile and determine: What strategic insight should I develop right now to help leadership make better decisions? Consider market analysis, competitive positioning, and growth opportunities.",
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
        decisionPrompt: "As the Dev Companion, analyze the business profile and determine: What technical improvement should I research or document right now to help the business scale? Consider automation, architecture, and developer productivity.",
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
        decisionPrompt: "As the Ops Orchestrator, analyze the business profile and determine: What operational improvement should I work on right now to make the business run more efficiently? Consider processes, workflows, and resource optimization.",
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
        decisionPrompt: "As the Security Analyst, analyze the business profile and determine: What security improvement should I research or document right now to protect the business? Consider compliance, threat prevention, and security best practices.",
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
        decisionPrompt: "As the AI Team Orchestrator, analyze the business profile and all active employees to determine: What strategic initiative should I coordinate right now that leverages multiple team members? Consider cross-functional opportunities and team synergies.",
    },
};

// Environment setup
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUTER_API_KEY = process.env.PUTER_API_KEY; // Optional - for server-side Puter calls

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface DeployedEmployee {
    id: string;
    user_id: string;
    name: string;
    template_id: string;
    status: string;
}

interface BusinessProfile {
    company_name: string;
    industry: string;
    description: string;
    target_audience: string;
    website?: string;
    brand_voice?: string;
    business_goals?: string[];
}

interface EmployeeMemory {
    memory_type: string;
    title: string;
    content: string;
    created_at: string;
}

interface BusinessInsight {
    category: string;
    title: string;
    insight: string;
}

/**
 * Call Puter AI API (server-side)
 */
async function callPuterAI(prompt: string, systemPrompt: string): Promise<string> {
    // Use fetch to call Puter's API directly
    const response = await fetch('https://api.puter.com/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(PUTER_API_KEY && { 'Authorization': `Bearer ${PUTER_API_KEY}` }),
        },
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
 * Get business context for a user
 */
async function getBusinessContext(userId: string): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data as BusinessProfile;
}

/**
 * Get employee's recent memories
 */
async function getEmployeeMemories(employeeId: string, limit = 15): Promise<EmployeeMemory[]> {
    const { data } = await supabase
        .from('employee_memory')
        .select('memory_type, title, content, created_at')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return (data || []) as EmployeeMemory[];
}

/**
 * Get business insights for a user
 */
async function getBusinessInsights(userId: string, limit = 20): Promise<BusinessInsight[]> {
    const { data } = await supabase
        .from('business_insights')
        .select('category, title, insight')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return (data || []) as BusinessInsight[];
}

/**
 * Store employee memory
 */
async function storeMemory(
    userId: string,
    employeeId: string,
    templateId: string,
    memoryType: string,
    title: string,
    content: string,
    outcome: string
): Promise<void> {
    await supabase.from('employee_memory').insert({
        user_id: userId,
        employee_id: employeeId,
        template_id: templateId,
        memory_type: memoryType,
        title,
        content,
        outcome,
    });
}

/**
 * Store business insight
 */
async function storeInsight(
    userId: string,
    employeeId: string,
    templateId: string,
    category: string,
    title: string,
    insight: string,
    recommendedAction?: string
): Promise<void> {
    await supabase.from('business_insights').insert({
        user_id: userId,
        employee_id: employeeId,
        template_id: templateId,
        category,
        title,
        insight,
        recommended_action: recommendedAction,
        is_actionable: !!recommendedAction,
        confidence_score: 0.75,
    });
}

/**
 * Store autonomous action
 */
async function storeAutonomousAction(
    userId: string,
    employeeId: string,
    templateId: string,
    actionType: string,
    title: string,
    description: string,
    parameters: Record<string, unknown>,
    priority: number
): Promise<string> {
    const { data, error } = await supabase.from('autonomous_actions').insert({
        user_id: userId,
        employee_id: employeeId,
        template_id: templateId,
        action_type: actionType,
        action_title: title,
        action_description: description,
        action_parameters: parameters,
        priority,
        status: 'pending',
    }).select('id').single();

    if (error) throw error;
    return data.id;
}

/**
 * Update action status
 */
async function updateActionStatus(
    actionId: string,
    status: string,
    result?: string,
    resultData?: Record<string, unknown>,
    error?: string
): Promise<void> {
    const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'in_progress') {
        updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
    }

    if (result) updates.result = result;
    if (resultData) updates.result_data = resultData;
    if (error) updates.error_message = error;

    await supabase.from('autonomous_actions').update(updates).eq('id', actionId);
}

/**
 * Ask an employee what they should do
 */
async function getEmployeeDecision(
    employee: DeployedEmployee,
    businessContext: BusinessProfile,
    memories: EmployeeMemory[],
    insights: BusinessInsight[],
    template: { autonomousDuties: string[]; decisionPrompt: string }
): Promise<{
    shouldAct: boolean;
    actionType: string;
    actionTitle: string;
    actionDescription: string;
    actionParameters: Record<string, unknown>;
    reasoning: string;
    priority: number;
}> {
    const prompt = `
${template.decisionPrompt}

=== BUSINESS PROFILE ===
Company: ${businessContext.company_name}
Industry: ${businessContext.industry}
Description: ${businessContext.description || 'Not provided'}
Target Audience: ${businessContext.target_audience || 'Not specified'}
${businessContext.website ? `Website: ${businessContext.website}` : ''}
${businessContext.brand_voice ? `Brand Voice: ${businessContext.brand_voice}` : ''}
${businessContext.business_goals?.length ? `Goals: ${businessContext.business_goals.join(', ')}` : ''}

=== YOUR AUTONOMOUS DUTIES ===
${template.autonomousDuties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

=== YOUR RECENT WORK (avoid duplicating) ===
${memories.length > 0 ? memories.slice(0, 10).map(m => `- [${m.memory_type}] ${m.title}`).join('\n') : 'No recent work recorded yet - this is a fresh start!'}

=== KNOWN BUSINESS INSIGHTS ===
${insights.length > 0 ? insights.slice(0, 10).map(i => `- [${i.category}] ${i.insight.substring(0, 100)}...`).join('\n') : 'No insights discovered yet - time to learn about this business!'}

Based on all this context, decide:
1. Should you take action right now? (YES if there's valuable work to do that you haven't already done recently)
2. If yes, what specific action from your duties list best serves the business right now?
3. What exactly will you do and why?

IMPORTANT: You are learning this business. Research it thoroughly. Discover insights. Make recommendations that will actually help them succeed.

Respond with ONLY a JSON object (no markdown):
{
    "shouldAct": true,
    "actionType": "research|create_content|analyze|recommend|delegate|learn",
    "actionTitle": "Brief action title",
    "actionDescription": "Detailed description of exactly what you will do",
    "actionParameters": {},
    "reasoning": "Why this action helps the business succeed",
    "priority": 1-10
}
`;

    try {
        const response = await callPuterAI(prompt, `You are ${employee.name}, an autonomous AI employee. You proactively work to help businesses succeed. Always respond with valid JSON only.`);
        
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        const decision = JSON.parse(cleaned);

        return {
            shouldAct: decision.shouldAct ?? true,
            actionType: decision.actionType || 'research',
            actionTitle: decision.actionTitle || 'Autonomous work',
            actionDescription: decision.actionDescription || '',
            actionParameters: decision.actionParameters || {},
            reasoning: decision.reasoning || '',
            priority: decision.priority || 5,
        };
    } catch (error) {
        console.error(`❌ Failed to get decision for ${employee.name}:`, error);
        return {
            shouldAct: false,
            actionType: 'error',
            actionTitle: 'Decision failed',
            actionDescription: String(error),
            actionParameters: {},
            reasoning: 'AI decision failed',
            priority: 0,
        };
    }
}

/**
 * Execute an employee's autonomous action
 */
async function executeAction(
    employee: DeployedEmployee,
    businessContext: BusinessProfile,
    action: {
        actionType: string;
        actionTitle: string;
        actionDescription: string;
        actionParameters: Record<string, unknown>;
    }
): Promise<{
    success: boolean;
    result: string;
    insights: Array<{ category: string; title: string; insight: string; recommendedAction?: string }>;
}> {
    const prompt = `
You are ${employee.name} executing an autonomous action to help a business succeed.

=== YOUR ACTION ===
Type: ${action.actionType}
Title: ${action.actionTitle}
Description: ${action.actionDescription}

=== BUSINESS CONTEXT ===
Company: ${businessContext.company_name}
Industry: ${businessContext.industry}
Description: ${businessContext.description || 'N/A'}
Target Audience: ${businessContext.target_audience || 'N/A'}
${businessContext.business_goals?.length ? `Goals: ${businessContext.business_goals.join(', ')}` : ''}

Execute this action thoroughly and provide real, actionable value:
- If researching: Provide specific findings, data points, and sources
- If creating content: Write the actual content
- If analyzing: Give detailed analysis with recommendations
- If recommending: Provide specific, prioritized recommendations

Your output should directly help this business succeed. Be specific to their industry, audience, and goals.

Respond with ONLY a JSON object (no markdown):
{
    "result": "Your detailed work output here - make it substantial and valuable",
    "insights": [
        {
            "category": "market|competitor|customer|product|operations|strategy",
            "title": "Insight title",
            "insight": "What you discovered",
            "recommendedAction": "What the business should do"
        }
    ]
}
`;

    try {
        const response = await callPuterAI(prompt, `You are an expert ${employee.name} performing real work. Be thorough, specific, and valuable.`);
        
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(cleaned);

        return {
            success: true,
            result: result.result || 'Action completed',
            insights: result.insights || [],
        };
    } catch (error) {
        console.error(`❌ Failed to execute action for ${employee.name}:`, error);
        return {
            success: false,
            result: String(error),
            insights: [],
        };
    }
}

/**
 * Process a single employee
 */
async function processEmployee(employee: DeployedEmployee): Promise<void> {
    console.log(`\n🤖 Processing ${employee.name} (${employee.template_id})...`);

    // Get template config
    const template = EMPLOYEE_TEMPLATES[employee.template_id];
    if (!template) {
        console.log(`⚠️ Unknown template: ${employee.template_id}, skipping`);
        return;
    }

    // Get business context
    const businessContext = await getBusinessContext(employee.user_id);
    if (!businessContext) {
        console.log(`⚠️ No business profile for user ${employee.user_id}, skipping`);
        return;
    }

    // Get employee's memories and known insights
    const memories = await getEmployeeMemories(employee.id);
    const insights = await getBusinessInsights(employee.user_id);

    // Ask the employee what they should do
    console.log(`💭 ${employee.name} is thinking...`);
    const decision = await getEmployeeDecision(employee, businessContext, memories, insights, template);

    if (!decision.shouldAct) {
        console.log(`😴 ${employee.name} decided no action needed right now`);
        return;
    }

    console.log(`✅ ${employee.name} decided: ${decision.actionTitle} (Priority: ${decision.priority})`);
    console.log(`   Reasoning: ${decision.reasoning}`);

    // Store the action
    const actionId = await storeAutonomousAction(
        employee.user_id,
        employee.id,
        employee.template_id,
        decision.actionType,
        decision.actionTitle,
        decision.actionDescription,
        decision.actionParameters,
        decision.priority
    );

    // Execute the action
    await updateActionStatus(actionId, 'in_progress');
    console.log(`⚡ ${employee.name} is executing: ${decision.actionTitle}...`);

    const result = await executeAction(employee, businessContext, decision);

    if (result.success) {
        // Store success
        await updateActionStatus(actionId, 'completed', result.result);
        await storeMemory(
            employee.user_id,
            employee.id,
            employee.template_id,
            'action',
            decision.actionTitle,
            result.result.substring(0, 5000), // Limit size
            'success'
        );

        // Store discovered insights
        for (const insight of result.insights) {
            await storeInsight(
                employee.user_id,
                employee.id,
                employee.template_id,
                insight.category,
                insight.title,
                insight.insight,
                insight.recommendedAction
            );
            console.log(`💡 New insight: ${insight.title}`);
        }

        console.log(`✨ ${employee.name} completed: ${decision.actionTitle}`);
    } else {
        await updateActionStatus(actionId, 'failed', undefined, undefined, result.result);
        await storeMemory(
            employee.user_id,
            employee.id,
            employee.template_id,
            'action',
            decision.actionTitle,
            `Failed: ${result.result}`,
            'failed'
        );
        console.log(`❌ ${employee.name} failed: ${result.result}`);
    }
}

/**
 * Main loop - process all employees
 */
async function runLoop(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 AUTONOMOUS AGENT LOOP - ' + new Date().toISOString());
    console.log('='.repeat(60));

    // Get all active deployed employees
    const { data: employees, error } = await supabase
        .from('ai_employees')
        .select('id, user_id, name, template_id, status')
        .eq('status', 'active');

    if (error) {
        console.error('❌ Failed to fetch employees:', error);
        return;
    }

    if (!employees || employees.length === 0) {
        console.log('😴 No active employees to process');
        return;
    }

    console.log(`👥 Found ${employees.length} active employees`);

    // Process each employee
    for (const employee of employees as DeployedEmployee[]) {
        try {
            await processEmployee(employee);
        } catch (error) {
            console.error(`❌ Error processing ${employee.name}:`, error);
        }

        // Small delay between employees to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Loop complete');
}

/**
 * Start the autonomous loop
 */
async function main(): Promise<void> {
    console.log('🚀 Starting Autonomous Agent Loop...');
    console.log(`⏰ Running every ${LOOP_INTERVAL_MS / 60000} minutes`);
    console.log('📡 Connected to Supabase:', SUPABASE_URL);

    // Run immediately
    await runLoop();

    // Then run on interval
    setInterval(runLoop, LOOP_INTERVAL_MS);

    console.log('\n🔄 Loop is running. Press Ctrl+C to stop.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down autonomous loop...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down...');
    process.exit(0);
});

main().catch(console.error);
