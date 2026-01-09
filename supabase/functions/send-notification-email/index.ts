import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  userId: string
  type: 'task_completed' | 'deployment_alert' | 'daily_digest' | 'weekly_summary' | 'security_alert' | 'welcome' | 'contact_form'
  subject?: string
  data?: Record<string, unknown>
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Email templates
const templates: Record<string, (data: Record<string, unknown>) => EmailTemplate> = {
  task_completed: (data) => ({
    subject: `Task Completed: ${data.taskName || 'AI Task'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Task Completed ✓</h1>
        <p>Your AI employee <strong>${data.employeeName || 'AI Assistant'}</strong> has completed a task.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Task:</strong> ${data.taskName || 'Task'}</p>
          <p style="margin: 8px 0 0;"><strong>Status:</strong> ${data.status || 'Completed'}</p>
          ${data.result ? `<p style="margin: 8px 0 0;"><strong>Result:</strong> ${data.result}</p>` : ''}
        </div>
        <a href="${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View in Dashboard
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          You're receiving this email because you have task notifications enabled.
          <a href="${data.preferencesUrl || 'https://app.auraa.ai/settings'}">Manage preferences</a>
        </p>
      </div>
    `,
    text: `Task Completed: ${data.taskName || 'AI Task'}\n\nYour AI employee ${data.employeeName || 'AI Assistant'} has completed a task.\n\nView in Dashboard: ${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}`
  }),

  deployment_alert: (data) => ({
    subject: `Deployment ${data.status === 'success' ? 'Successful' : 'Failed'}: ${data.employeeName || 'AI Employee'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${data.status === 'success' ? '#10b981' : '#ef4444'};">
          Deployment ${data.status === 'success' ? 'Successful ✓' : 'Failed ✗'}
        </h1>
        <p>Your AI employee deployment has ${data.status === 'success' ? 'completed successfully' : 'encountered an issue'}.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Employee:</strong> ${data.employeeName || 'AI Employee'}</p>
          <p style="margin: 8px 0 0;"><strong>Category:</strong> ${data.category || 'General'}</p>
          ${data.error ? `<p style="margin: 8px 0 0; color: #ef4444;"><strong>Error:</strong> ${data.error}</p>` : ''}
        </div>
        <a href="${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View in Dashboard
        </a>
      </div>
    `,
    text: `Deployment ${data.status === 'success' ? 'Successful' : 'Failed'}: ${data.employeeName || 'AI Employee'}\n\n${data.error ? `Error: ${data.error}\n\n` : ''}View in Dashboard: ${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}`
  }),

  daily_digest: (data) => ({
    subject: `Your Daily AI Summary - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Daily Summary 📊</h1>
        <p>Here's what your AI team accomplished today:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Tasks Completed:</strong> ${data.tasksCompleted || 0}</p>
          <p style="margin: 8px 0 0;"><strong>Active Employees:</strong> ${data.activeEmployees || 0}</p>
          <p style="margin: 8px 0 0;"><strong>Success Rate:</strong> ${data.successRate || 100}%</p>
        </div>
        ${data.highlights ? `
          <h3>Highlights</h3>
          <ul>
            ${(data.highlights as string[]).map(h => `<li>${h}</li>`).join('')}
          </ul>
        ` : ''}
        <a href="${data.dashboardUrl || 'https://app.auraa.ai/analytics'}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Full Analytics
        </a>
      </div>
    `,
    text: `Daily Summary\n\nTasks Completed: ${data.tasksCompleted || 0}\nActive Employees: ${data.activeEmployees || 0}\nSuccess Rate: ${data.successRate || 100}%\n\nView Full Analytics: ${data.dashboardUrl || 'https://app.auraa.ai/analytics'}`
  }),

  weekly_summary: (data) => ({
    subject: `Your Weekly AI Report - Week of ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Weekly Report 📈</h1>
        <p>Here's your AI team's performance this week:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Total Tasks:</strong> ${data.totalTasks || 0}</p>
          <p style="margin: 8px 0 0;"><strong>Hours Saved:</strong> ${data.hoursSaved || 0}</p>
          <p style="margin: 8px 0 0;"><strong>Cost Savings:</strong> $${data.costSavings || 0}</p>
        </div>
        <a href="${data.dashboardUrl || 'https://app.auraa.ai/analytics'}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Full Report
        </a>
      </div>
    `,
    text: `Weekly Report\n\nTotal Tasks: ${data.totalTasks || 0}\nHours Saved: ${data.hoursSaved || 0}\nCost Savings: $${data.costSavings || 0}\n\nView Full Report: ${data.dashboardUrl || 'https://app.auraa.ai/analytics'}`
  }),

  security_alert: (data) => ({
    subject: `⚠️ Security Alert: ${data.alertType || 'Suspicious Activity Detected'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">⚠️ Security Alert</h1>
        <p>We detected suspicious activity on your account.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Alert Type:</strong> ${data.alertType || 'Suspicious Activity'}</p>
          <p style="margin: 8px 0 0;"><strong>IP Address:</strong> ${data.ipAddress || 'Unknown'}</p>
          <p style="margin: 8px 0 0;"><strong>Location:</strong> ${data.location || 'Unknown'}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${data.timestamp || new Date().toISOString()}</p>
        </div>
        <p>If this was you, you can safely ignore this email. If not, please secure your account immediately.</p>
        <a href="${data.securityUrl || 'https://app.auraa.ai/settings/security'}" 
           style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Review Security Settings
        </a>
      </div>
    `,
    text: `Security Alert: ${data.alertType || 'Suspicious Activity Detected'}\n\nIP Address: ${data.ipAddress || 'Unknown'}\nLocation: ${data.location || 'Unknown'}\n\nReview Security Settings: ${data.securityUrl || 'https://app.auraa.ai/settings/security'}`
  }),

  welcome: (data) => ({
    subject: `Welcome to Auraa AI! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to Auraa AI! 🎉</h1>
        <p>Hi ${data.name || 'there'},</p>
        <p>Thank you for joining Auraa AI. We're excited to help you build your AI workforce!</p>
        <h3>Get Started</h3>
        <ol>
          <li><strong>Deploy your first AI employee</strong> - Choose from our templates</li>
          <li><strong>Connect your tools</strong> - Integrate with your existing workflow</li>
          <li><strong>Watch the magic happen</strong> - Your AI team will start working for you</li>
        </ol>
        <a href="${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Go to Dashboard
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Need help? Check out our <a href="https://docs.auraa.ai">documentation</a> or contact support.
        </p>
      </div>
    `,
    text: `Welcome to Auraa AI!\n\nHi ${data.name || 'there'},\n\nThank you for joining Auraa AI. We're excited to help you build your AI workforce!\n\nGet Started:\n1. Deploy your first AI employee\n2. Connect your tools\n3. Watch the magic happen\n\nGo to Dashboard: ${data.dashboardUrl || 'https://app.auraa.ai/dashboard'}`
  }),

  contact_form: (data) => ({
    subject: data.subject ? `Contact Form: ${data.subject}` : 'New Contact Form Submission',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">New Contact Form Submission</h1>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>From:</strong> ${data.name || 'Unknown'}</p>
          <p style="margin: 8px 0 0;"><strong>Email:</strong> ${data.email || 'N/A'}</p>
          ${data.company ? `<p style="margin: 8px 0 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
          <p style="margin: 8px 0 0;"><strong>Subject:</strong> ${data.subject || 'No subject'}</p>
        </div>
        <div style="background: white; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 8px 0 0; white-space: pre-wrap;">${data.message || 'No message'}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          Reply to: <a href="mailto:${data.email}">${data.email}</a>
        </p>
      </div>
    `,
    text: `New Contact Form Submission\n\nFrom: ${data.name || 'Unknown'}\nEmail: ${data.email || 'N/A'}\n${data.company ? `Company: ${data.company}\n` : ''}Subject: ${data.subject || 'No subject'}\n\nMessage:\n${data.message || 'No message'}\n\nReply to: ${data.email}`
  })
}

// Send email using configured service
async function sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend'
  const apiKey = Deno.env.get('EMAIL_API_KEY')
  const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@auraa.ai'
  const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'Auraa AI'

  if (!apiKey) {
    console.warn('EMAIL_API_KEY not configured - emails will be logged only')
    console.log('Would send email:', { to, subject: template.subject })
    return { success: true, messageId: 'mock-' + Date.now() }
  }

  try {
    if (emailService === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Resend API error: ${error}`)
      }

      const result = await response.json()
      return { success: true, messageId: result.id }

    } else if (emailService === 'sendgrid') {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromAddress, name: fromName },
          subject: template.subject,
          content: [
            { type: 'text/plain', value: template.text },
            { type: 'text/html', value: template.html }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      return { success: true, messageId: response.headers.get('x-message-id') || undefined }
    }

    throw new Error(`Unsupported email service: ${emailService}`)

  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, type, subject, data = {} } = await req.json() as EmailRequest

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name, display_name')
      .eq('id', userId)
      .single()

    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'User not found or no email address' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check notification preferences (skip for security alerts and welcome emails)
    if (type !== 'security_alert' && type !== 'welcome') {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (prefs) {
        const prefKey = `email_${type}` as keyof typeof prefs
        if (prefs[prefKey] === false) {
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: 'User opted out' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Generate email from template
    const templateFn = templates[type]
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const enrichedData = {
      ...data,
      name: user.display_name || user.full_name || user.email.split('@')[0],
      userEmail: user.email
    }

    const template = templateFn(enrichedData)
    if (subject) {
      template.subject = subject
    }

    // Send email
    const result = await sendEmail(user.email, template)

    // Log notification
    await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        notification_type: type,
        channel: 'email',
        subject: template.subject,
        status: result.success ? 'sent' : 'failed',
        metadata: { messageId: result.messageId, error: result.error },
        sent_at: result.success ? new Date().toISOString() : null
      })

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
