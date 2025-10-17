import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { deployment_request_id } = await req.json();

    if (!deployment_request_id) {
      throw new Error("Missing deployment_request_id in request body");
    }

    // 1. Fetch the deployment request and the template name
    const { data: deploymentRequest, error: requestError } = await supabase
      .from("ai_employee_deployment_requests")
      .select(`
        id,
        user_id,
        status,
        deployment_config,
        ai_helper_templates ( name )
      `)
      .eq("id", deployment_request_id)
      .single();

    if (requestError) {
      throw new Error(`Deployment request not found: ${requestError.message}`);
    }

    if (deploymentRequest.status !== 'pending') {
      throw new Error(`Deployment request has already been processed. Status: ${deploymentRequest.status}`);
    }

    // 2. "Deploy" the employee by creating a record in the ai_employees table
    const { error: insertError } = await supabase
      .from("ai_employees")
      .insert({
        user_id: deploymentRequest.user_id,
        deployment_request_id: deploymentRequest.id,
        name: (deploymentRequest.ai_helper_templates as { name: string }).name || 'AI Employee',
        deployment_config: deploymentRequest.deployment_config,
        status: 'active',
      });

    if (insertError) {
      await supabase
        .from("ai_employee_deployment_requests")
        .update({ status: "rejected", rejection_reason: "Failed to create AI employee record." })
        .eq("id", deployment_request_id);
      throw new Error(`Failed to create AI employee: ${insertError.message}`);
    }

    // 3. Update the deployment request status to 'approved'
    const { error: updateError } = await supabase
      .from("ai_employee_deployment_requests")
      .update({ status: "approved" })
      .eq("id", deployment_request_id);

    if (updateError) {
      throw new Error(`Failed to update deployment request status: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: "AI Employee deployed successfully." }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});