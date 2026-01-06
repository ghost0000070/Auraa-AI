# Auraa AI Platform - Copilot Instructions

## Critical Guidelines

### Memory & Context Awareness
- **ALWAYS** remember previous conversations and maintain continuity across the session
- **ALWAYS** keep the full codebase structure and patterns in mind when making changes
- **ALWAYS** remember the purpose of this project: Auraa AI is a SaaS platform for deploying autonomous AI "employees" (agents) that can perform tasks, automations, and workflows for users
- Understand what the platform does: enables users to deploy, manage, and interact with AI agents that handle various business tasks

### Debugging Protocol (ULTRATHINK MODE)
When debugging, activate **ULTRATHINK MODE**—be extremely over-thorough:
1. **First Pass**: Identify the issue and understand the full context
2. **Second Pass**: Trace the code path and check all related files
3. **Third Pass**: Verify assumptions, check types, and validate logic
4. **Fourth Pass**: Final review—confirm the fix is complete and doesn't introduce new issues

**Debugging Checklist:**
- [ ] Check the error message and stack trace carefully
- [ ] Trace data flow from source to destination
- [ ] Verify all imports and dependencies
- [ ] Check for typos, case sensitivity, and syntax errors
- [ ] Validate types match across function boundaries
- [ ] Test edge cases and null/undefined scenarios
- [ ] Confirm fix doesn't break existing functionality
- [ ] Review related tests if they exist

**Never rush debugging.** Take the time to understand the root cause, not just the symptom.

---

## Architecture Overview

Auraa AI is a React + TypeScript SaaS platform for deploying AI "employees" (autonomous agents). Key architectural layers:

- **Frontend**: React 18 + Vite + TypeScript with shadcn/ui components (Radix primitives + Tailwind)
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions)
- **AI Layer**: Dual-provider strategy—Puter.js (client-side, free) → Supabase Edge Functions (fallback)
- **Payments**: Polar.sh integration for subscriptions

## Key Patterns

### Import Aliases
Always use `@/` path aliases configured in `tsconfig.app.json`:
```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
```

### AI Task Execution (Dual Provider)
Tasks try Puter.js first, fallback to edge functions. See `src/lib/ai-engine.ts`:
```typescript
// Use executeTask() for AI operations—handles fallback automatically
const result = await executeTask(taskName, data, systemContext, AI_MODELS.STANDARD);
```
Model constants defined in `src/config/constants.ts`: `COMPLEX`, `STANDARD`, `FAST`.

### Puter.js Integration
Puter provides free client-side AI via `window.puter`. Key patterns:

**Direct AI calls** (in `src/lib/ai-engine.ts`):
```typescript
// Access via window.puter (loaded via script tag)
const response = await window.puter.ai.chat(prompt, { model: 'claude-sonnet-4-5' });
const content = response.message?.content?.[0]?.text;
```

**Auth state** via `usePuter()` hook (`src/hooks/usePuter.tsx`):
```typescript
const { username, authToken, isLoading, error } = usePuter();
// Check if user is signed into Puter (separate from Supabase auth)
```

**Type definitions** in `src/types/puter.d.ts` - update when using new Puter APIs.

**Fallback flow**: If `window.puter` unavailable or throws, `executeTask()` automatically calls the `agent-run` edge function which uses Puter's server API.

### Authentication & Authorization
- Use `useAuth()` hook for user state, subscription status, and admin checks
- Wrap protected routes with `<ProtectedRoute>` component
- Use `<SubscriptionGuard requiredTier="Premium">` for tier-gated features
- Owner bypass via `VITE_OWNER_EMAIL` / `VITE_OWNER_UID` env vars

### UI Components
Using shadcn/ui—components live in `src/components/ui/`. Add new components via:
```bash
npx shadcn@latest add [component-name]
```
Use `cn()` utility from `@/lib/utils` for conditional class merging.

### Supabase Patterns
```typescript
// Query with RLS (user data automatically filtered)
const { data, error } = await supabase
  .from('ai_employees')
  .select('*')
  .eq('user_id', user.id);

// Realtime subscriptions (see useAgentRealtime hook)
supabase.channel('tasks').on('postgres_changes', { ... }).subscribe();
```

### Error Handling
Use `errorTracker` from `@/lib/errorTracking` for Sentry integration:
```typescript
errorTracker.captureError(error, { tags: { component: 'MyComponent' }, user: { id: user?.id } });
```

### Toast Notifications
Use sonner via the toast utilities:
```typescript
import { toast } from "sonner";
toast.success("Deployed!");
toast.error("Failed to deploy");
```

## Project Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run test     # Vitest
npm run preview  # Preview production build
npm run worker   # Start agent worker (requires env vars)
```

## Agent Worker

The background worker (`scripts/agentWorker.ts`) processes queued automation tasks using Playwright.

**What it does:**
- Polls `agent_task_queue` table for pending tasks
- Executes browser automation (scraping, form filling, login flows)
- Logs events to `agent_action_logs` with real-time updates
- Decrypts credentials using RSA envelope encryption

**Supported actions:** `scrape_website`, `webhook_call`, `analyze_data`, `generate_content`, `login_and_scrape`

**Running the worker:**
```bash
# Install Playwright browsers (one-time)
npx playwright install chromium

# Set required env vars
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export INTEGRATION_RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Run worker
npx tsx scripts/agentWorker.ts
```

**Adding new actions:** Update the `switch` statement in `executeAction()` and optionally add to `agent_actions` table.

## Edge Functions (Supabase)

Located in `supabase/functions/`. Deploy with:
```bash
supabase functions deploy [function-name]
```

Key functions:
- `agent-run`: Execute AI tasks with Puter Claude API fallback
- `polar-webhook` / `polar-subscription-handler`: Payment processing
- `integration-public-key`: RSA key for credential encryption

## Database Schema

Core tables (with RLS enforced):
- `users`: Auth + subscription state
- `ai_employees`: Deployed AI agents per user
- `deployment_requests`: Deployment queue/history
- `agent_tasks` / `agent_task_events`: Task execution queue + logs

See `docs/database_usage.md` for query patterns.

## AI Employee Templates

Defined in `src/lib/ai-employee-templates.tsx`. Each template has:
- `id`, `name`, `role`, `category`, `skills`, `personality`
- `backendTask`: Maps to AI engine task handler
- `isPremium`: Controls subscription tier requirement

## Environment Variables

Required in `.env` (frontend):
```
VITE_SUPABASE_URL=https://iupgzyloawweklvbyjlx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_woex9t3dG-TniELsWJAd7w_SQa3WXNB
VITE_OWNER_EMAIL=fckit006@icloud.com
VITE_OWNER_UID=369409c1-298f-4d8f-869c-dc062cf13500
VITE_POLAR_ACCESS_TOKEN=polar_oat_aVL1thBXFDEHlutwQkTTqxBDhGJDmtteF1RiB4OqGnn
```

Required for Supabase Edge Functions (set in Supabase dashboard):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POLAR_ACCESS_TOKEN=polar_oat_xxx
POLAR_WEBHOOK_SECRET=your-webhook-secret
POLAR_PRO_PRODUCT_ID=5b17226c-d73a-466e-88f1-d6a2662468be
POLAR_ENTERPRISE_PRODUCT_ID=a9b9d4de-bdb1-4c75-bb41-a0f39c1888ea
POLAR_ORGANIZATION_ID=your-polar-org-id
INTEGRATION_RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
INTEGRATION_RSA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
EMAIL_SERVICE=resend
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=noreply@auraa.ai
EMAIL_FROM_NAME=Auraa AI
```

Required for Agent Worker (scripts/agentWorker.ts):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INTEGRATION_RSA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
```

Optional frontend variables:
```
VITE_API_RATE_LIMIT=100
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
```

## Code Conventions

- Pages: `src/pages/` (lazy-loaded via React.lazy)
- Components: `src/components/` (features) + `src/components/ui/` (primitives)
- Hooks: `src/hooks/` with `use` prefix
- Types: `src/types/` for shared type definitions
- Tailwind: Use semantic color tokens (`bg-primary`, `text-foreground`) over raw colors
