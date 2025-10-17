# Agent Automation & Website Integrations

This document describes how the Auraa AI agent automation layer works for registering websites, encrypting credentials, and executing actions via a headless worker.

## Overview
1. User adds an Integration (website) at `/integrations`.
2. Credentials are encrypted client-side using RSA-OAEP + AES-GCM envelope and stored as ciphertext only.
3. User triggers an action (e.g., `scrape_dashboard`). An Edge Function (`agent-run`) enqueues a task after validating action + parameters.
4. A background worker (`scripts/agentWorker.ts`) polls queued tasks, runs them (Playwright), logs events, and updates status.
5. UI uses realtime subscriptions to display live task + event updates.

## Schema Components
Tables (see migrations):
- `integration_targets` — Website/domain registration.
- `integration_credentials` — Encrypted credentials (ciphertext only).
- `agent_actions` — Whitelisted actions (registry) with parameter schema.
- `agent_tasks` — Queue of tasks.
- `agent_task_events` — Append-only event log per task.

## Credential Encryption
Client fetches the RSA public key from edge function `integration-public-key` and performs:
- Generate ephemeral AES-256-GCM key.
- Encrypt plaintext JSON (username/password) with AES-GCM.
- Encrypt raw AES key with RSA-OAEP (SHA-256).
- Store envelope JSON in `cipher_text`.

Private key is never exposed to the browser; the worker decrypts envelopes with `INTEGRATION_RSA_PRIVATE_KEY`.

## Environment Variables
| Variable | Location | Purpose |
|----------|----------|---------|
| `INTEGRATION_RSA_PUBLIC_KEY` | Edge functions / frontend fetch via function | Public key PEM for encryption |
| `INTEGRATION_RSA_PRIVATE_KEY` | Worker environment only | Private key PEM for decryption |
| `SUPABASE_URL` | Worker | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker | Service role key (never expose to browser) |

## Deploying Edge Functions
```
supabase functions deploy integration-public-key
supabase functions deploy agent-run
```

## Running Worker
Install dependencies (ensure `playwright` browsers installed):
```
npm install playwright @supabase/supabase-js
npx playwright install chromium
node dist/scripts/agentWorker.js   # or ts-node scripts/agentWorker.ts
```
Set required env vars before running.

## Adding a New Action
1. Insert new record into `agent_actions` with unique `name` and optional JSON schema for parameters.
2. Update worker `switch` statement to implement the action logic.
3. (Optional) Add UI form parameter inputs.

## Realtime
The `useAgentRealtime` hook subscribes to `agent_tasks` and `agent_task_events` changes via Supabase Realtime. Ensure Realtime is enabled for those tables.

## Hardening Roadmap
- Add structured JSON Schema validation server-side (Zod or Ajv in edge function).
- Rate limiting (tasks per user per minute) via Postgres function + RLS restrictions.
- Add retry strategy columns (attempt_count, max_attempts, next_run_at).
- Implement secret rotation for RSA key pair.
- Add per-action scoping rules (allowed_domains overrides, required auth type enforcement).
- Observability: aggregate metrics (success rate, avg duration) into a materialized view.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Action not allowed | Missing/disabled `agent_actions` entry | Insert or enable in registry |
| Credential decrypt failed | Wrong key pair or malformed envelope | Regenerate keys, re-add integration |
| No realtime updates | Realtime not enabled for table | Enable replication on Supabase dashboard |
| Tasks stay queued | Worker not running or missing service role key | Start worker with proper env |

## Key Rotation Strategy (Outline)
1. Generate new key pair.
2. Publish new public key in edge function.
3. Mark old key as deprecated; newly added credentials use new key.
4. Background job re-encrypts old envelopes with new key (decrypt using old private key, re-encrypt with new public key).
5. After all rotated, remove old private key.

---
This system provides a secure, auditable foundation for agent-driven business process automation. Extend carefully with least-privilege principles.
