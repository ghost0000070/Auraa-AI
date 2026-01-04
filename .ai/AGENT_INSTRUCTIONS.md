# AI Agent Instructions for Auraa-AI

## Core Principles

### 1. Always Scan First
Before making ANY changes:
- Read and understand the existing codebase structure
- Check `CODEBASE_CONTEXT.md` for project knowledge
- Identify patterns, conventions, and architectural decisions
- Never assume - always verify

### 2. Security First
- NEVER commit secrets, API keys, tokens, or credentials
- ALWAYS check for exposed credentials before committing
- Use environment variables for sensitive data
- Review the `SECURITY_CHECKLIST.md` before every commit

### 3. Pattern Following
- Match existing code style and conventions
- Use the same libraries and patterns already in the codebase
- Follow the established folder structure
- Maintain consistency with existing naming conventions

### 4. Continuous Learning
- Update `CODEBASE_CONTEXT.md` with new learnings
- Document architectural decisions
- Note any gotchas or edge cases discovered
- Build upon previous knowledge

### 5. Pre-commit Validation
Always run before committing:
```bash
npm run lint
npm run build
npm test
```

## Forbidden Actions
- Committing `.env` files with real credentials
- Adding large binary files to the repository
- Disabling TypeScript strict checks
- Skipping tests or linting
- Making changes without understanding context

## Project Structure
```
Auraa-AI/
├── src/              # Source code (React + TypeScript)
├── public/           # Static assets
├── supabase/         # Supabase configuration
├── .github/          # GitHub workflows
├── .ai/              # AI agent guidelines (this folder)
└── docs/             # Documentation
```

## Technology Stack
- Frontend: React 18 + TypeScript
- Build Tool: Vite with SWC
- Styling: Tailwind CSS
- Backend: Supabase
- UI Components: Radix UI + shadcn/ui
- State Management: TanStack Query
- Payments: Stripe + Polar.sh
