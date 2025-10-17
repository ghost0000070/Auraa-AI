/*
  Agent Worker
  ------------
  Polls queued tasks from Supabase, executes actions using Playwright, updates task status & events.
  Requirements:
    - Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INTEGRATION_RSA_PRIVATE_KEY (PEM)
    - npm dependencies: @supabase/supabase-js, playwright

  Run: npx ts-node scripts/agentWorker.ts  (or compile to JS first)
*/
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RSA_PRIVATE_PEM = process.env.INTEGRATION_RSA_PRIVATE_KEY!; // PKCS8 PEM

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
if (!RSA_PRIVATE_PEM) {
  console.error('Missing INTEGRATION_RSA_PRIVATE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function logEvent(task_id: string, level: string, message: string, context?: any) {
  await supabase.from('agent_task_events').insert({ task_id, level, message, context });
}

interface Envelope {
  version: number;
  algo: string;
  key: string;
  iv: string;
  cipher: string;
}

function base64ToBuf(b64: string) {
  return Buffer.from(b64, 'base64');
}

function decryptEnvelope(env: Envelope): string {
  if (env.algo !== 'RSA-OAEP+AES-GCM') throw new Error('Unsupported envelope algo');
  const privateKey = crypto.createPrivateKey(RSA_PRIVATE_PEM);
  const aesKeyRaw = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, base64ToBuf(env.key));
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKeyRaw, base64ToBuf(env.iv));
  const cipherBuf = base64ToBuf(env.cipher);
  // GCM tag is last 16 bytes
  const tag = cipherBuf.slice(cipherBuf.length - 16);
  const data = cipherBuf.slice(0, cipherBuf.length - 16);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

async function fetchCredentials(target_id: string, owner_user: string) {
  const { data, error } = await supabase
    .from('integration_credentials')
    .select('cipher_text')
    .eq('target_id', target_id)
    .eq('owner_user', owner_user)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  try {
    const parsed = JSON.parse(data.cipher_text);
    if (parsed && parsed.algo) {
      const plaintext = decryptEnvelope(parsed);
      return JSON.parse(plaintext);
    }
    // legacy base64 fallback
    const legacy = Buffer.from(data.cipher_text, 'base64').toString('utf8');
    return JSON.parse(legacy);
  } catch (e) {
    console.warn('Credential decrypt failed', e);
    return null;
  }
}

async function fetchNextTask() {
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('status', 'queued')
    .lte('next_run_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0];
}

async function markTask(id: string, patch: any) {
  await supabase.from('agent_tasks').update(patch).eq('id', id);
}

async function runTask(task: any) {
  await markTask(task.id, { status: 'running', started_at: new Date().toISOString(), attempt_count: task.attempt_count + 1 });
  await logEvent(task.id, 'info', `Task started (attempt ${task.attempt_count + 1})`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    switch (task.action) {
      case 'scrape_dashboard': {
        const url = task.parameters.url;
        const selector = task.parameters.selector || 'h1';
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await logEvent(task.id, 'info', 'Navigated', { url });
        const text = await page.textContent(selector).catch(()=>null);
        await markTask(task.id, { status: 'success', result: { selector, text }, finished_at: new Date().toISOString() });
        await logEvent(task.id, 'info', 'Extraction complete', { selector, text });
        break;
      }
      case 'login_and_scrape': {
        const creds = await fetchCredentials(task.target_id, task.owner_user);
        if (!creds) throw new Error('Credentials not found');
        const { url, username_selector, password_selector, selector } = task.parameters;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.fill(username_selector, creds.username);
        await page.fill(password_selector, creds.password);
        await page.press(password_selector, 'Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await logEvent(task.id, 'info', 'Login submitted');
        const text = await page.textContent(selector).catch(()=>null);
        await markTask(task.id, { status: 'success', result: { selector, text }, finished_at: new Date().toISOString() });
        await logEvent(task.id, 'info', 'Extraction complete after login', { selector, text });
        break;
      }
      default:
        await logEvent(task.id, 'error', 'Unknown action', { action: task.action });
        await markTask(task.id, { status: 'error', error: 'Unknown action', finished_at: new Date().toISOString() });
    }
  } catch (e: any) {
    await logEvent(task.id, 'error', 'Execution failed', { error: e.message });
    if (task.attempt_count + 1 >= task.max_attempts) {
      await markTask(task.id, { status: 'error', error: `Failed after ${task.max_attempts} attempts: ${e.message}`, finished_at: new Date().toISOString() });
    } else {
      const nextRun = new Date(Date.now() + 1000 * (2 ** task.attempt_count) * 5); // 5s, 10s, 20s...
      await markTask(task.id, { status: 'queued', next_run_at: nextRun.toISOString() });
      await logEvent(task.id, 'warn', `Retrying at ${nextRun.toISOString()}`);
    }
  } finally {
    await browser.close();
  }
}

async function loop() {
  while (true) {
    try {
      const task = await fetchNextTask();
      if (task) {
        await runTask(task);
      } else {
        await new Promise(r => setTimeout(r, 4000));
      }
    } catch (e) {
      console.error('Worker loop error', e);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

loop();
