#!/bin/bash
# Initialize blog settings in Supabase

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-https://iupgzyloawweklvbyjlx.supabase.co}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-sb_publishable_woex9t3dG-TniELsWJAd7w_SQa3WXNB}"

echo "Initializing blog settings..."
echo "URL: $SUPABASE_URL"

# Check if settings exist
EXISTING=$(curl -s "$SUPABASE_URL/rest/v1/blog_settings?select=id&limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

echo "Existing settings: $EXISTING"

if [ "$EXISTING" != "[]" ]; then
  echo "Blog settings already exist. Skipping..."
  exit 0
fi

# Create settings
curl -s -X POST "$SUPABASE_URL/rest/v1/blog_settings" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d @- << 'EOF'
{
  "ai_auto_reply_enabled": true,
  "ai_moderation_enabled": true,
  "ai_content_generation_enabled": true,
  "default_ai_agent_id": "blog-agent",
  "require_comment_approval": false,
  "allow_guest_comments": true,
  "posts_per_page": 10,
  "featured_post_ids": [],
  "social_share_enabled": true,
  "newsletter_cta_enabled": true,
  "auto_generate_ideas": true,
  "idea_generation_frequency": "weekly",
  "auto_schedule_posts": true,
  "posts_per_week": 2,
  "preferred_posting_days": ["tuesday", "thursday"],
  "preferred_posting_time": "09:00:00",
  "learning_enabled": true,
  "learning_update_frequency": "daily",
  "auto_seo_optimization": true,
  "content_focus_areas": ["ai-employees", "automation", "productivity"]
}
EOF

echo ""
echo "Blog settings initialized!"
