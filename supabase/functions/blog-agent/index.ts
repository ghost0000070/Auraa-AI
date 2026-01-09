import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Anthropic API for server-side AI (Puter.js is client-side only)
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface BlogAgentRequest {
  action: 
    | 'generate_post'
    | 'reply_comment'
    | 'moderate_comment'
    | 'generate_ideas'
    | 'optimize_seo'
    | 'auto_reply_new_comment';
  params: Record<string, unknown>;
}

// System prompts for different blog tasks
const SYSTEM_PROMPTS = {
  generatePost: `You are the Auraa AI Blog Agent, an expert content creator for the Auraa AI platform.
Your role is to write engaging, informative blog posts about AI employees, automation, and business productivity.

Brand Voice: Confident, forward-thinking, practical, and approachable.
Topics: AI employees, business automation, workflow optimization, productivity, future of work.

Writing Guidelines:
- Use clear, jargon-free language
- Include practical examples and actionable insights
- Structure with compelling headlines and subheadings
- Aim for 800-1500 words
- Include a strong call-to-action

Return a JSON object with: title, slug, excerpt, content (in Markdown), category, tags[], seo_title, seo_description, seo_keywords[]`,

  replyComment: `You are the Auraa AI Blog Agent, responding to reader comments on the Auraa AI blog.

Guidelines:
- Be helpful, friendly, and professional
- Address the commenter by name if provided
- Provide valuable insights or clarification
- Keep responses concise (50-150 words)
- If they have questions, answer them or direct to resources
- Thank them for engaging

Return a JSON object with: reply (string), should_flag (boolean), flag_reason (string if flagged)`,

  moderateComment: `You are the Auraa AI Content Moderator for the Auraa AI blog.

Review the comment for:
- Spam or promotional content
- Offensive or inappropriate language
- Off-topic content
- Bot-like patterns

Return a JSON object with: 
- is_approved (boolean)
- is_flagged (boolean)
- flag_reason (string, if flagged)
- suggested_action: "approve" | "flag" | "delete"`,

  generateIdeas: `You are the Auraa AI Content Strategist.

Generate blog post ideas for the Auraa AI platform based on:
- Current AI and automation trends
- Common user questions and pain points
- SEO opportunities
- Content gaps

Return a JSON object with: ideas[] where each idea has: title, category, target_keyword, estimated_engagement ("high" | "medium" | "low"), brief_outline[]`,

  optimizeSeo: `You are the Auraa AI SEO Specialist.

Optimize the provided blog post for search engines:
- Suggest improved title (60 chars max)
- Write meta description (155 chars max)
- Identify target keywords
- Suggest internal/external linking opportunities
- Check heading structure

Return a JSON object with: seo_title, seo_description, seo_keywords[], suggested_headings[], linking_opportunities[]`,
};

async function callAnthropicAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Extract content from Anthropic response format
  let content = '';
  if (data.content?.[0]?.text) {
    content = data.content[0].text;
  } else if (typeof data.content === 'string') {
    content = data.content;
  }
  
  if (!content) {
    throw new Error('Empty response from Anthropic API');
  }
  
  return content;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authorization - require either service role key or valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, params } = await req.json() as BlogAgentRequest;

    let result: unknown;

    switch (action) {
      case 'generate_post': {
        const topic = params.topic as string;
        const category = params.category as string || 'general';
        
        const prompt = `Generate a blog post about: "${topic}"
Category: ${category}
Target Keywords: ${(params.keywords as string[])?.join(', ') || 'AI employees, automation'}
Tone: professional yet approachable
Length: 800-1200 words`;

        const aiResponse = await callAnthropicAI(prompt, SYSTEM_PROMPTS.generatePost);
        
        // Parse JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        
        const postData = JSON.parse(jsonMatch[0]);
        
        // Create post in database
        const { data: post, error } = await supabaseClient
          .from('blog_posts')
          .insert({
            title: postData.title,
            slug: postData.slug || generateSlug(postData.title),
            excerpt: postData.excerpt,
            content: postData.content,
            category: postData.category || category,
            tags: postData.tags || [],
            seo_title: postData.seo_title,
            seo_description: postData.seo_description,
            seo_keywords: postData.seo_keywords,
            reading_time_minutes: calculateReadingTime(postData.content),
            is_ai_generated: true,
            ai_agent_id: 'blog-agent',
            status: 'draft',
            author_name: 'Auraa AI',
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Log the action
        await supabaseClient.from('blog_agent_actions').insert({
          action_type: 'generate_content',
          target_id: post.id,
          target_type: 'post',
          ai_agent_id: 'blog-agent',
          input_prompt: prompt,
          output_result: JSON.stringify(post),
          status: 'completed',
        });
        
        result = { success: true, post };
        break;
      }

      case 'reply_comment': {
        const commentId = params.commentId as string;
        const postId = params.postId as string;
        
        // Get comment and post
        const { data: comment } = await supabaseClient
          .from('blog_comments')
          .select('*')
          .eq('id', commentId)
          .single();
        
        const { data: post } = await supabaseClient
          .from('blog_posts')
          .select('title, category')
          .eq('id', postId)
          .single();
        
        if (!comment || !post) {
          throw new Error('Comment or post not found');
        }
        
        const prompt = `Post: "${post.title}" (Category: ${post.category})

Comment from ${comment.guest_name || 'a reader'}:
"${comment.content}"

Generate a thoughtful, helpful reply.`;

        const aiResponse = await callAnthropicAI(prompt, SYSTEM_PROMPTS.replyComment);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        
        const replyData = JSON.parse(jsonMatch[0]);
        
        // Post the reply
        const { data: replyComment, error } = await supabaseClient
          .from('blog_comments')
          .insert({
            post_id: postId,
            parent_id: commentId,
            content: replyData.reply,
            is_ai_reply: true,
            ai_agent_id: 'blog-agent',
            guest_name: 'Auraa AI',
            is_approved: true,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Flag original if needed
        if (replyData.should_flag) {
          await supabaseClient
            .from('blog_comments')
            .update({ is_flagged: true })
            .eq('id', commentId);
        }
        
        // Log action
        await supabaseClient.from('blog_agent_actions').insert({
          action_type: 'reply_comment',
          target_id: commentId,
          target_type: 'comment',
          ai_agent_id: 'blog-agent',
          input_prompt: prompt,
          output_result: replyData.reply,
          status: 'completed',
        });
        
        result = { success: true, reply: replyData.reply };
        break;
      }

      case 'moderate_comment': {
        const commentId = params.commentId as string;
        
        const { data: comment } = await supabaseClient
          .from('blog_comments')
          .select('*')
          .eq('id', commentId)
          .single();
        
        if (!comment) {
          throw new Error('Comment not found');
        }
        
        const prompt = `Comment from ${comment.guest_name || 'Anonymous'}:
"${comment.content}"`;

        const aiResponse = await callAnthropicAI(prompt, SYSTEM_PROMPTS.moderateComment);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        
        const moderation = JSON.parse(jsonMatch[0]);
        
        // Apply moderation
        await supabaseClient
          .from('blog_comments')
          .update({
            is_approved: moderation.is_approved,
            is_flagged: moderation.is_flagged,
          })
          .eq('id', commentId);
        
        // Log action
        await supabaseClient.from('blog_agent_actions').insert({
          action_type: 'moderate_comment',
          target_id: commentId,
          target_type: 'comment',
          ai_agent_id: 'blog-agent',
          input_prompt: prompt,
          output_result: JSON.stringify(moderation),
          status: 'completed',
        });
        
        result = { success: true, action: moderation.suggested_action };
        break;
      }

      case 'generate_ideas': {
        const context = params.context as string || 
          'Generate 5 blog post ideas for the Auraa AI platform, focusing on AI employees and business automation.';
        
        const aiResponse = await callAnthropicAI(context, SYSTEM_PROMPTS.generateIdeas);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        
        const data = JSON.parse(jsonMatch[0]);
        
        // Log action
        await supabaseClient.from('blog_agent_actions').insert({
          action_type: 'generate_content',
          target_type: null,
          ai_agent_id: 'blog-agent',
          input_prompt: context,
          output_result: JSON.stringify(data),
          status: 'completed',
        });
        
        result = { success: true, ideas: data.ideas };
        break;
      }

      case 'optimize_seo': {
        const postId = params.postId as string;
        
        const { data: post } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .eq('id', postId)
          .single();
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        const prompt = `Post Title: ${post.title}
Category: ${post.category}
Current Tags: ${post.tags?.join(', ')}
Excerpt: ${post.excerpt}

Content (first 500 chars): ${post.content.substring(0, 500)}...`;

        const aiResponse = await callAnthropicAI(prompt, SYSTEM_PROMPTS.optimizeSeo);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }
        
        const seoData = JSON.parse(jsonMatch[0]);
        
        // Update post
        await supabaseClient
          .from('blog_posts')
          .update({
            seo_title: seoData.seo_title,
            seo_description: seoData.seo_description,
            seo_keywords: seoData.seo_keywords,
          })
          .eq('id', postId);
        
        // Log action
        await supabaseClient.from('blog_agent_actions').insert({
          action_type: 'seo_optimize',
          target_id: postId,
          target_type: 'post',
          ai_agent_id: 'blog-agent',
          input_prompt: prompt,
          output_result: JSON.stringify(seoData),
          status: 'completed',
        });
        
        result = { success: true, optimizations: seoData };
        break;
      }

      case 'auto_reply_new_comment': {
        // Called by database webhook when new comment is inserted
        const commentId = params.commentId as string;
        const postId = params.postId as string;
        
        // Check settings
        const { data: settings } = await supabaseClient
          .from('blog_settings')
          .select('ai_auto_reply_enabled')
          .single();
        
        if (!settings?.ai_auto_reply_enabled) {
          result = { success: true, skipped: true, reason: 'Auto-reply disabled' };
          break;
        }
        
        // Check if comment is AI (don't reply to AI comments)
        const { data: comment } = await supabaseClient
          .from('blog_comments')
          .select('is_ai_reply')
          .eq('id', commentId)
          .single();
        
        if (comment?.is_ai_reply) {
          result = { success: true, skipped: true, reason: 'AI comment' };
          break;
        }
        
        // Generate reply (reuse reply_comment logic)
        const replyResult = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reply_comment',
            params: { commentId, postId },
          }),
        });
        
        result = await replyResult.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Blog agent error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
