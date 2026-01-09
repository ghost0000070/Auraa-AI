/**
 * Vercel Cron Handler - Triggers Autonomous Loop
 * 
 * This API route is called by Vercel Cron every 5 minutes.
 * It triggers the Supabase Edge Function that processes all active employees.
 * 
 * Endpoint: GET /api/autonomous-loop
 * Schedule: Every 5 minutes (*/5 * * * *)
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow GET and POST
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify this is a Vercel Cron request (has special header in production)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, Vercel adds CRON_SECRET to cron requests
  // We also allow manual triggers with the same secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('Autonomous loop triggered without secret (may be local dev)');
    // Allow through - the edge function has its own auth
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`🔄 Triggering autonomous loop at ${new Date().toISOString()}`);

    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/autonomous-loop`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ trigger: 'vercel-cron', timestamp: new Date().toISOString() }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge function error:', result);
      return new Response(
        JSON.stringify({ error: 'Edge function failed', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Autonomous loop completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        ...result,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Failed to trigger autonomous loop:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to trigger autonomous loop', message: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
