import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { stripe } from "../_utils/stripe.ts";

const supabaseAdmin = createClient(
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
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("Missing user_id in request body");
    }

    let { data: customer, error } = await supabaseAdmin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user_id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        metadata: { user_id },
      });

      const { data: newCustomer, error: insertError } = await supabaseAdmin
        .from("stripe_customers")
        .insert({ user_id, stripe_customer_id: stripeCustomer.id })
        .select("stripe_customer_id")
        .single();

      if (insertError) {
        throw insertError;
      }
      customer = newCustomer;

      // Also add a basic user role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: user_id, role: 'user' });

      if (roleError) {
        console.warn(`Failed to assign default role to new user ${user_id}`, roleError);
      }
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${Deno.env.get("SITE_URL")}/dashboard`,
    });

    return new Response(JSON.stringify({ url }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});