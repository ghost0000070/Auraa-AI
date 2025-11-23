import * as admin from 'firebase-admin';
import { chromium } from 'playwright';
import * as crypto from 'crypto';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

const RSA_PRIVATE_PEM = process.env.INTEGRATION_RSA_PRIVATE_KEY!;

if (!RSA_PRIVATE_PEM) {
  console.error('Missing INTEGRATION_RSA_PRIVATE_KEY');
  process.exit(1);
}

async function logEvent(task_id: string, level: string, message: string, context?: Record<string, unknown>) {
  await db.collection('agent_task_events').add({ task_id, level, message, context, createdAt: new Date() });
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
  const tag = cipherBuf.slice(cipherBuf.length - 16);
  const data = cipherBuf.slice(0, cipherBuf.length - 16);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

async function fetchCredentials(target_id: string, owner_user: string) {
  const credsSnapshot = await db.collection('integration_credentials')
    .where('target_id', '==', target_id)
    .where('owner_user', '==', owner_user)
    .limit(1)
    .get();
  if (credsSnapshot.empty) return null;
  const data = credsSnapshot.docs[0].data();
  try {
    const parsed = JSON.parse(data.cipher_text);
    if (parsed && parsed.algo) {
      const plaintext = decryptEnvelope(parsed);
      return JSON.parse(plaintext);
    }
    const legacy = Buffer.from(data.cipher_text, 'base64').toString('utf8');
    return JSON.parse(legacy);
  } catch (e) {
    console.warn('Credential decrypt failed', e);
    return null;
  }
}

interface AgentTask {
    id: string;
    action: string;
    parameters: {
        url: string;
        selector?: string;
        username_selector?: string;
        password_selector?: string;
    };
    target_id: string;
    owner_user: string;
    attempt_count?: number;
    max_attempts?: number;
}

async function fetchNextTask(): Promise<AgentTask | null> {
  const tasksSnapshot = await db.collection('agent_tasks')
    .where('status', '==', 'queued')
    .where('next_run_at', '<=', new Date())
    .orderBy('next_run_at')
    .orderBy('createdAt')
    .limit(1)
    .get();
  if (tasksSnapshot.empty) return null;
  const doc = tasksSnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AgentTask;
}

async function markTask(id: string, patch: Record<string, unknown>) {
  await db.collection('agent_tasks').doc(id).update(patch);
}

async function runTask(task: AgentTask) {
  await markTask(task.id, { status: 'running', started_at: new Date(), attempt_count: (task.attempt_count || 0) + 1 });
  await logEvent(task.id, 'info', `Task started (attempt ${(task.attempt_count || 0) + 1})`);

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
        await markTask(task.id, { status: 'success', result: { selector, text }, finished_at: new Date() });
        await logEvent(task.id, 'info', 'Extraction complete', { selector, text });
        break;
      }
      case 'login_and_scrape': {
        const creds = await fetchCredentials(task.target_id, task.owner_user);
        if (!creds) throw new Error('Credentials not found');
        const { url, username_selector, password_selector, selector } = task.parameters;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.fill(username_selector!, creds.username);
        await page.fill(password_selector!, creds.password);
        await page.press(password_selector!, 'Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await logEvent(task.id, 'info', 'Login submitted');
        const text = await page.textContent(selector!).catch(()=>null);
        await markTask(task.id, { status: 'success', result: { selector, text }, finished_at: new Date() });
        await logEvent(task.id, 'info', 'Extraction complete after login', { selector, text });
        break;
      }
      default:
        await logEvent(task.id, 'error', 'Unknown action', { action: task.action });
        await markTask(task.id, { status: 'error', error: 'Unknown action', finished_at: new Date() });
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    await logEvent(task.id, 'error', 'Execution failed', { error: errorMessage });
    const max_attempts = task.max_attempts || 1;
    const attempt_count = task.attempt_count || 0;
    if (attempt_count + 1 >= max_attempts) {
      await markTask(task.id, { status: 'error', error: `Failed after ${max_attempts} attempts: ${errorMessage}`, finished_at: new Date() });
    } else {
      const nextRun = new Date(Date.now() + 1000 * (2 ** attempt_count) * 5); // 5s, 10s, 20s...
      await markTask(task.id, { status: 'queued', next_run_at: nextRun });
      await logEvent(task.id, 'warn', `Retrying at ${nextRun.toISOString()}`);
    }
  } finally {
    await browser.close();
  }
}

async function loop() {
  // eslint-disable-next-line no-constant-condition
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

// loop();
