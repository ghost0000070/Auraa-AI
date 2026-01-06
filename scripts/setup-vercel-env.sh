#!/bin/bash
# =====================================================
# Vercel Environment Variables Setup Script
# Run this script to set all required environment variables in Vercel
# =====================================================

# Exit on error
set -e

echo "🔧 Setting up Vercel Environment Variables..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if linked to project
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Not linked to a Vercel project. Run: vercel link"
    exit 1
fi

# Read from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Reading values from .env file..."
    # Source env vars (handle multiline properly)
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # Export the variable
        export "$key"="$value"
    done < <(grep -v '^#' .env | grep '=')
fi

# Function to set env var
set_env() {
    local name=$1
    local value=$2
    local scope=${3:-production}
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $name (no value provided)"
        return
    fi
    
    echo "Setting $name for $scope..."
    echo "$value" | vercel env add "$name" "$scope" --force 2>/dev/null || true
}

echo ""
echo "📦 Setting Vercel environment variables..."
echo "(These will be set for production, preview, and development)"

# Core Variables
for scope in production preview development; do
    echo ""
    echo "🎯 Setting $scope variables..."
    set_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL" "$scope"
    set_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY" "$scope"
    set_env "VITE_OWNER_EMAIL" "$VITE_OWNER_EMAIL" "$scope"
    set_env "VITE_OWNER_UID" "$VITE_OWNER_UID" "$scope"
    set_env "VITE_POLAR_ACCESS_TOKEN" "$VITE_POLAR_ACCESS_TOKEN" "$scope"
    set_env "VITE_ENABLE_ANALYTICS" "true" "$scope"
    set_env "VITE_API_RATE_LIMIT" "100" "$scope"
done

echo ""
echo "✅ Vercel environment variables setup complete!"
echo ""
echo "📋 To verify, run: vercel env ls"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy to Vercel: vercel --prod"
