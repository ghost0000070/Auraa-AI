#!/bin/bash
# =====================================================
# Supabase Edge Function Secrets Setup Script
# Run this script to set all required secrets for edge functions
# =====================================================

# Exit on error
set -e

echo "🔧 Setting up Supabase Edge Function Secrets..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run: supabase login"
    exit 1
fi

# Read from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Reading values from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Function to set secret with confirmation
set_secret() {
    local name=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $name (no value provided)"
        return
    fi
    
    echo "Setting $name..."
    supabase secrets set "$name=$value"
}

echo ""
echo "📦 Setting Supabase secrets..."

# Core Supabase (usually auto-provided, but set explicitly for edge functions)
set_secret "SUPABASE_URL" "${SUPABASE_URL:-$VITE_SUPABASE_URL}"
set_secret "SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# Polar.sh Configuration
set_secret "POLAR_ACCESS_TOKEN" "${POLAR_ACCESS_TOKEN:-$VITE_POLAR_ACCESS_TOKEN}"
set_secret "POLAR_WEBHOOK_SECRET" "$POLAR_WEBHOOK_SECRET"
set_secret "POLAR_PRO_PRODUCT_ID" "$POLAR_PRO_PRODUCT_ID"
set_secret "POLAR_ENTERPRISE_PRODUCT_ID" "$POLAR_ENTERPRISE_PRODUCT_ID"
set_secret "POLAR_ORGANIZATION_ID" "$POLAR_ORGANIZATION_ID"

# RSA Keys for Integration Encryption
set_secret "INTEGRATION_RSA_PUBLIC_KEY" "$INTEGRATION_RSA_PUBLIC_KEY"
set_secret "INTEGRATION_RSA_PRIVATE_KEY" "$INTEGRATION_RSA_PRIVATE_KEY"

# Email Service
set_secret "EMAIL_SERVICE" "$EMAIL_SERVICE"
set_secret "EMAIL_API_KEY" "$EMAIL_API_KEY"
set_secret "EMAIL_FROM_ADDRESS" "$EMAIL_FROM_ADDRESS"
set_secret "EMAIL_FROM_NAME" "$EMAIL_FROM_NAME"

# AI Keys (optional)
if [ -n "$OPENAI_API_KEY" ]; then
    set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
fi

if [ -n "$AI_GATEWAY_API_KEY" ]; then
    set_secret "AI_GATEWAY_API_KEY" "$AI_GATEWAY_API_KEY"
fi

echo ""
echo "✅ Supabase secrets setup complete!"
echo ""
echo "📋 To verify, run: supabase secrets list"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy edge functions: supabase functions deploy"
echo "   2. Run database migrations: supabase db push"
