/**
 * Agent Worker - Background Task Processor
 * 
 * Polls agent_task_queue for pending tasks and executes them using Playwright.
 * Logs events to agent_action_logs and updates task status in real-time.
 * 
 * Required environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (never expose to browser)
 *   INTEGRATION_RSA_PRIVATE_KEY - RSA private key PEM for decrypting credentials
 * 
 * Usage:
 *   npx playwright install chromium
 *   npx tsx scripts/agentWorker.ts
 */

/// <reference types="node" />
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { chromium, Browser } from 'playwright';
import * as crypto from 'node:crypto';

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTEGRATION_RSA_PRIVATE_KEY = process.env.INTEGRATION_RSA_PRIVATE_KEY;

const POLL_INTERVAL_MS = 5000; // 5 seconds
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// Types
// ============================================================

interface AgentTask {
  id: string;
  user_id: string;
  deployed_employee_id: string | null;
  action_name: string;
  priority: number;
  payload: Record<string, unknown>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  locked_at: string | null;
  locked_by: string | null;
  error_message: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface EncryptedEnvelope {
  encryptedAesKey: string; // Base64-encoded RSA-encrypted AES key
  iv: string;              // Base64-encoded AES-GCM IV
  ciphertext: string;      // Base64-encoded AES-GCM ciphertext
  authTag: string;         // Base64-encoded AES-GCM auth tag
}

interface ActionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTimeMs?: number;
}

// ============================================================
// Credential Decryption
// ============================================================

function decryptCredentials(envelope: EncryptedEnvelope): Record<string, string> {
  if (!INTEGRATION_RSA_PRIVATE_KEY) {
    throw new Error('INTEGRATION_RSA_PRIVATE_KEY not configured');
  }

  // Decrypt AES key with RSA-OAEP
  const encryptedAesKey = Buffer.from(envelope.encryptedAesKey, 'base64');
  const aesKey = crypto.privateDecrypt(
    {
      key: INTEGRATION_RSA_PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedAesKey
  );

  // Decrypt payload with AES-256-GCM
  const iv = Buffer.from(envelope.iv, 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
  const authTag = Buffer.from(envelope.authTag, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

// ============================================================
// Logging Helpers
// ============================================================

async function logEvent(
  userId: string,
  taskId: string,
  actionName: string,
  eventType: 'started' | 'progress' | 'completed' | 'failed',
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase.from('agent_action_logs').insert({
    user_id: userId,
    action_name: actionName,
    status: eventType === 'completed' ? 'success' : eventType === 'failed' ? 'failed' : 'running',
    input_params: { task_id: taskId, ...metadata },
    output_result: eventType === 'completed' ? metadata : null,
    error_message: eventType === 'failed' ? message : null,
    started_at: eventType === 'started' ? new Date().toISOString() : null,
    completed_at: ['completed', 'failed'].includes(eventType) ? new Date().toISOString() : null,
  });

  const emoji = eventType === 'completed' ? '✅' : eventType === 'failed' ? '❌' : '🔄';
  console.log(`${emoji} [${taskId.slice(0, 8)}] ${actionName}: ${message}`);
}

async function updateTaskStatus(
  taskId: string,
  status: AgentTask['status'],
  result?: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('agent_task_queue')
    .update({
      status,
      result: result ?? null,
      error_message: errorMessage ?? null,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
}

// ============================================================
// Action Handlers
// ============================================================

async function executeAction(
  task: AgentTask,
  browser: Browser
): Promise<ActionResult> {
  const startTime = Date.now();
  const { action_name, payload, user_id } = task;

  try {
    switch (action_name) {
      case 'scrape_website':
        return await actionScrapeWebsite(payload, browser);

      case 'webhook_call':
        return await actionWebhookCall(payload);

      case 'analyze_data':
        return await actionAnalyzeData(payload);

      case 'generate_content':
        return await actionGenerateContent(payload);

      case 'login_and_scrape':
        return await actionLoginAndScrape(payload, user_id, browser);

      default:
        return {
          success: false,
          error: `Unknown action: ${action_name}`,
          executionTimeMs: Date.now() - startTime,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// --- Action: Scrape Website ---
async function actionScrapeWebsite(
  payload: Record<string, unknown>,
  browser: Browser
): Promise<ActionResult> {
  const startTime = Date.now();
  const url = payload.url as string;

  if (!url) {
    return { success: false, error: 'Missing required parameter: url' };
  }

  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const title = await page.title();
    const content = await page.evaluate(() => {
      // Extract main content, removing scripts and styles
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach((el) => el.remove());
      return document.body?.innerText?.slice(0, 10000) || '';
    });

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .slice(0, 50)
    );

    return {
      success: true,
      result: { title, content, links, url },
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    await page.close();
  }
}

// --- Action: Webhook Call ---
async function actionWebhookCall(payload: Record<string, unknown>): Promise<ActionResult> {
  const startTime = Date.now();
  const url = payload.url as string;
  const method = (payload.method as string) || 'POST';
  const body = payload.body as Record<string, unknown> | undefined;

  if (!url) {
    return { success: false, error: 'Missing required parameter: url' };
  }

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await response.text();
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch {
    parsedBody = responseBody;
  }

  return {
    success: response.ok,
    result: {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    },
    error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    executionTimeMs: Date.now() - startTime,
  };
}

// --- Action: Analyze Data (calls Puter API) ---
async function actionAnalyzeData(payload: Record<string, unknown>): Promise<ActionResult> {
  const startTime = Date.now();
  const data = payload.data;
  const analysisType = payload.analysis_type as string;

  const prompt = `Analyze the following data. Analysis type: ${analysisType}\n\nData:\n${JSON.stringify(data, null, 2)}\n\nProvide a structured analysis in JSON format.`;

  const response = await fetch('https://api.puter.com/drivers/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-chat-completion',
      driver: 'claude-sonnet-4-5',
      method: 'complete',
      args: {
        messages: [{ role: 'user', content: prompt }],
      }
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Puter API error: ${response.status}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const result = await response.json();
  const content = result.message?.content?.[0]?.text || result.result;

  return {
    success: true,
    result: { analysis: content },
    executionTimeMs: Date.now() - startTime,
  };
}

// --- Action: Generate Content (calls Puter API) ---
async function actionGenerateContent(payload: Record<string, unknown>): Promise<ActionResult> {
  const startTime = Date.now();
  const prompt = payload.prompt as string;
  const contentType = payload.content_type as string;

  const fullPrompt = `Generate ${contentType} content based on the following prompt:\n\n${prompt}`;

  const response = await fetch('https://api.puter.com/drivers/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-chat-completion',
      driver: 'claude-sonnet-4-5',
      method: 'complete',
      args: {
        messages: [{ role: 'user', content: fullPrompt }],
      }
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Puter API error: ${response.status}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const result = await response.json();
  const content = result.message?.content?.[0]?.text || result.result;

  return {
    success: true,
    result: { content, contentType },
    executionTimeMs: Date.now() - startTime,
  };
}

// --- Action: Login and Scrape (uses encrypted credentials) ---
async function actionLoginAndScrape(
  payload: Record<string, unknown>,
  userId: string,
  browser: Browser
): Promise<ActionResult> {
  const startTime = Date.now();
  const integrationTargetId = payload.integration_target_id as string;
  const targetUrl = payload.url as string;
  const selectors = payload.selectors as {
    usernameField: string;
    passwordField: string;
    submitButton: string;
    successIndicator?: string;
  };

  if (!integrationTargetId || !targetUrl || !selectors) {
    return {
      success: false,
      error: 'Missing required parameters: integration_target_id, url, selectors',
    };
  }

  // Fetch encrypted credentials
  const { data: credData, error: credError } = await supabase
    .from('integration_credentials')
    .select('encrypted_value')
    .eq('integration_target_id', integrationTargetId)
    .eq('user_id', userId)
    .single();

  if (credError || !credData) {
    return {
      success: false,
      error: 'Failed to fetch credentials for integration',
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Decrypt credentials
  let credentials: Record<string, string>;
  try {
    credentials = decryptCredentials(credData.encrypted_value as EncryptedEnvelope);
  } catch (error) {
    return {
      success: false,
      error: `Credential decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const page = await browser.newPage();
  try {
    // Navigate to login page
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Fill login form
    await page.fill(selectors.usernameField, credentials.username || credentials.email || '');
    await page.fill(selectors.passwordField, credentials.password || '');
    await page.click(selectors.submitButton);

    // Wait for navigation or success indicator
    if (selectors.successIndicator) {
      await page.waitForSelector(selectors.successIndicator, { timeout: 15000 });
    } else {
      await page.waitForLoadState('networkidle');
    }

    // Scrape content after login
    const title = await page.title();
    const content = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach((el) => el.remove());
      return document.body?.innerText?.slice(0, 10000) || '';
    });

    return {
      success: true,
      result: { title, content, loginSuccessful: true },
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: `Login/scrape failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    await page.close();
  }
}

// ============================================================
// Task Polling & Processing
// ============================================================

async function claimTask(): Promise<AgentTask | null> {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  // Find and lock a queued task atomically
  const { data, error } = await supabase
    .from('agent_task_queue')
    .update({
      status: 'processing',
      locked_at: now.toISOString(),
      locked_by: WORKER_ID,
    })
    .eq('status', 'queued')
    .lte('scheduled_for', now.toISOString())
    .or(`locked_at.is.null,locked_at.lt.${lockExpiry.toISOString()}`)
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .select('*')
    .single();

  if (error || !data) {
    return null;
  }

  // Increment attempt count
  await supabase
    .from('agent_task_queue')
    .update({ attempts: (data.attempts || 0) + 1 })
    .eq('id', data.id);

  return data as AgentTask;
}

async function processTask(task: AgentTask, browser: Browser): Promise<void> {
  console.log(`\n📋 Processing task: ${task.id.slice(0, 8)} | Action: ${task.action_name}`);

  await logEvent(task.user_id, task.id, task.action_name, 'started', 'Task execution started');

  const result = await executeAction(task, browser);

  if (result.success) {
    await updateTaskStatus(task.id, 'completed', result.result as Record<string, unknown>);
    await logEvent(
      task.user_id,
      task.id,
      task.action_name,
      'completed',
      `Task completed in ${result.executionTimeMs}ms`,
      result.result as Record<string, unknown>
    );
  } else {
    const shouldRetry = task.attempts < task.max_attempts;
    const newStatus = shouldRetry ? 'queued' : 'failed';

    await updateTaskStatus(task.id, newStatus, undefined, result.error);
    await logEvent(
      task.user_id,
      task.id,
      task.action_name,
      'failed',
      `${result.error}${shouldRetry ? ` (retry ${task.attempts}/${task.max_attempts})` : ' (max retries reached)'}`,
      { attempts: task.attempts, maxAttempts: task.max_attempts }
    );
  }
}

// ============================================================
// Main Worker Loop
// ============================================================

async function runWorker(): Promise<void> {
  console.log(`🚀 Agent Worker starting... (ID: ${WORKER_ID})`);
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔄 Poll interval: ${POLL_INTERVAL_MS}ms\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('🌐 Browser launched\n');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down worker...');
    await browser.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Main polling loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const task = await claimTask();

      if (task) {
        await processTask(task, browser);
      } else {
        // No tasks available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error) {
      console.error('❌ Worker error:', error);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

// Start the worker
runWorker().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
