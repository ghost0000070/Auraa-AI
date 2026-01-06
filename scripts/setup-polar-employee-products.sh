#!/bin/bash
# =====================================================
# Auraa AI - Polar Employee Products Setup Script
# =====================================================
# This script sets the Polar product IDs for each AI employee
# as Supabase Edge Function secrets.
#
# FIRST: Create these products in Polar.sh dashboard:
# 1. Go to https://polar.sh/dashboard
# 2. Select your organization
# 3. Go to Products → Create Product
# 4. Create each product as a MONTHLY SUBSCRIPTION at the listed price
# 5. Copy each product ID and paste below
# =====================================================

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

echo "🚀 Auraa AI - Employee Polar Product Setup"
echo "============================================"
echo ""
echo "Create these products in Polar.sh dashboard first!"
echo ""

# Employee products to create in Polar.sh
# Format: "ENV_VAR_NAME|PRODUCT_NAME|PRICE"
EMPLOYEES=(
    "POLAR_EMPLOYEE_MARKETING_PRO_PRODUCT_ID|Marketing Pro|99"
    "POLAR_EMPLOYEE_SALES_SIDEKICK_PRODUCT_ID|Sales Sidekick|129"
    "POLAR_EMPLOYEE_SUPPORT_SENTINEL_PRODUCT_ID|Support Sentinel|79"
    "POLAR_EMPLOYEE_BUSINESS_ANALYST_PRODUCT_ID|Business Analyst|149"
    "POLAR_EMPLOYEE_DEV_COMPANION_PRODUCT_ID|Dev Companion|119"
    "POLAR_EMPLOYEE_OPERATIONS_ORCHESTRATOR_PRODUCT_ID|Ops Orchestrator|99"
    "POLAR_EMPLOYEE_SECURITY_ANALYST_PRODUCT_ID|Security Analyst|159"
    "POLAR_EMPLOYEE_AI_TEAM_ORCHESTRATOR_PRODUCT_ID|AI Team Orchestrator|179"
)

echo "📋 Products to create in Polar.sh:"
echo ""
printf "%-40s %-25s %s\n" "ENV Variable" "Product Name" "Price"
echo "------------------------------------------------------------------------"

for employee in "${EMPLOYEES[@]}"; do
    IFS='|' read -r env_var name price <<< "$employee"
    printf "%-40s %-25s \$%s/month\n" "$env_var" "$name" "$price"
done

echo ""
echo "------------------------------------------------------------------------"
echo ""
echo "After creating products in Polar, enter their IDs below."
echo "Press Enter to skip any product you haven't created yet."
echo ""

# Collect product IDs
declare -A PRODUCT_IDS

for employee in "${EMPLOYEES[@]}"; do
    IFS='|' read -r env_var name price <<< "$employee"
    read -p "Enter Polar Product ID for $name (\$$price/mo) [skip]: " product_id
    if [ -n "$product_id" ]; then
        PRODUCT_IDS[$env_var]=$product_id
    fi
done

echo ""

# Set secrets
if [ ${#PRODUCT_IDS[@]} -eq 0 ]; then
    echo "⚠️  No product IDs entered. Exiting."
    exit 0
fi

echo "🔐 Setting Supabase secrets..."
echo ""

for env_var in "${!PRODUCT_IDS[@]}"; do
    product_id="${PRODUCT_IDS[$env_var]}"
    echo "Setting $env_var..."
    supabase secrets set "$env_var=$product_id"
done

echo ""
echo "✅ Done! Secrets set for ${#PRODUCT_IDS[@]} employee products."
echo ""
echo "Next steps:"
echo "1. Deploy the edge function: supabase functions deploy polar-subscription-handler"
echo "2. Test a checkout flow in the marketplace"
