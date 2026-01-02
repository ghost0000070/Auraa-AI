import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integrationId, url, userId } = await req.json()

    if (!integrationId || !url || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: integrationId, url, and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update status to scraping
    await supabase
      .from('website_integrations')
      .update({ status: 'scraping' })
      .eq('id', integrationId)
      .eq('user_id', userId)

    // Fetch and parse the website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuraaAI-Bot/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const document = new DOMParser().parseFromString(html, 'text/html')

    if (!document) {
      throw new Error('Failed to parse HTML')
    }

    // Extract useful data
    const title = document.querySelector('title')?.textContent || 'No title'
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean)
    const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean)
    const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
      text: a.textContent?.trim(),
      href: a.getAttribute('href')
    }))

    const scrapedData = {
      title,
      metaDescription,
      headings: headings.slice(0, 20),
      paragraphs: paragraphs.slice(0, 50),
      links: links.slice(0, 50),
      scrapedAt: new Date().toISOString(),
    }

    // Update the database with scraped data
    const { error: updateError } = await supabase
      .from('website_integrations')
      .update({
        status: 'active',
        scraped_data: scrapedData,
        last_scraped_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    // Use Puter's free Claude API to analyze the content
    try {
      const summary = await fetch('https://api.puter.com/drivers/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interface: 'puter-chat-completion',
          driver: 'claude-sonnet-4-5',
          method: 'complete',
          args: {
            messages: [
              {
                role: 'system',
                content: 'Analyze website content and provide a brief summary of what the business does, their target audience, and key offerings.'
              },
              {
                role: 'user',
                content: `Website: ${title}\nDescription: ${metaDescription}\nHeadings: ${headings.slice(0, 10).join(', ')}`
              }
            ]
          }
        }),
      })

      if (summary.ok) {
        const summaryData = await summary.json()
        const aiSummary = summaryData.message?.content?.[0]?.text || summaryData.result

        await supabase
          .from('website_integrations')
          .update({ ai_summary: aiSummary })
          .eq('id', integrationId)
      }
    } catch (aiError) {
      console.error('AI summary error:', aiError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: scrapedData,
        message: 'Website scraped successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { integrationId, userId } = await req.json().catch(() => ({}))
      if (integrationId && userId) {
        await supabase
          .from('website_integrations')
          .update({ status: 'error' })
          .eq('id', integrationId)
          .eq('user_id', userId)
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
