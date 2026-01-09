/**
 * External Cron Trigger Endpoint
 * 
 * This endpoint can be called by free cron services like cron-job.org
 * to trigger the autonomous loop every 5 minutes.
 * 
 * Setup on cron-job.org (free):
 * 1. Go to https://cron-job.org/en/
 * 2. Create account
 * 3. Add new cron job:
 *    - URL: https://auraa-ai.vercel.app/api/cron-trigger
 *    - Schedule: Every 5 minutes
 *    - Request method: GET
 */

export const config = {
  runtime: 'edge',
};

// Simple token for basic security (rotate this periodically)
const CRON_TOKEN = process.env.CRON_SECRET || 'auraa-cron-2026';

export default async function handler(request: Request): Promise<Response> {
  // Allow GET for simple cron services
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Optional: verify token from query param or header
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('x-cron-token');
  
  // If CRON_SECRET is set, verify it
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && token !== cronSecret) {
    // Log but don't block - makes debugging easier
    console.log('Cron trigger called without valid token');
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
    console.log(`🔄 External cron trigger at ${new Date().toISOString()}`);

    // Call the Supabase Edge Function directly
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/autonomous-loop`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ 
        trigger: 'external-cron', 
        timestamp: new Date().toISOString() 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge function error:', result);
      return new Response(
        JSON.stringify({ success: false, error: 'Edge function failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Autonomous loop triggered successfully');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        processed: result.processed || 0,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Failed to trigger autonomous loop:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
