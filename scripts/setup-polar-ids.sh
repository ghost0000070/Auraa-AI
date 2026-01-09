#!/bin/bash
# Quick setup script for Polar product IDs
# Run this after creating products in Polar dashboard

echo "🚀 Setting up Polar product IDs for per-employee subscriptions..."
echo ""
echo "⚠️  Before running this script:"
echo "   1. Create 8 products in Polar.sh dashboard"
echo "   2. Copy each Product ID (format: prod_xxxxxxxxxxxxx)"
echo "   3. Replace the placeholders below with actual IDs"
echo ""

# Replace these with your actual Polar product IDs
MARKETING_PRO_ID="prod_REPLACE_ME"
SALES_SIDEKICK_ID="prod_REPLACE_ME"
SUPPORT_SENTINEL_ID="prod_REPLACE_ME"
BUSINESS_ANALYST_ID="prod_REPLACE_ME"
DEV_COMPANION_ID="prod_REPLACE_ME"
OPERATIONS_ID="prod_REPLACE_ME"
SECURITY_ANALYST_ID="prod_REPLACE_ME"
TEAM_ORCHESTRATOR_ID="prod_REPLACE_ME"

echo "Setting Supabase secrets..."
supabase secrets set POLAR_MARKETING_PRO_ID="$MARKETING_PRO_ID"
supabase secrets set POLAR_SALES_SIDEKICK_ID="$SALES_SIDEKICK_ID"
supabase secrets set POLAR_SUPPORT_SENTINEL_ID="$SUPPORT_SENTINEL_ID"
supabase secrets set POLAR_BUSINESS_ANALYST_ID="$BUSINESS_ANALYST_ID"
supabase secrets set POLAR_DEV_COMPANION_ID="$DEV_COMPANION_ID"
supabase secrets set POLAR_OPERATIONS_ID="$OPERATIONS_ID"
supabase secrets set POLAR_SECURITY_ANALYST_ID="$SECURITY_ANALYST_ID"
supabase secrets set POLAR_TEAM_ORCHESTRATOR_ID="$TEAM_ORCHESTRATOR_ID"

echo ""
echo "✅ Secrets set! Now redeploy the webhook:"
echo "   supabase functions deploy polar-webhook"
echo ""
echo "📝 Don't forget to:"
echo "   1. Build frontend: npm run build"
echo "   2. Deploy: vercel deploy --prod"
echo "   3. Test a subscription end-to-end"
