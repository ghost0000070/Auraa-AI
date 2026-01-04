# AI Agent Instructions for Auraa-AI

## Core Principles

### 1. Always Scan First
Before making ANY changes:
- Read and understand the existing codebase structure
- Check `CODEBASE_CONTEXT.md` for project knowledge
- Identify patterns, conventions, and architectural decisions
- Never assume - always verify

### 2. Never Skip Issues - Always Fix Correctly
**CRITICAL**: This is a non-negotiable principle:
- **NEVER skip or ignore any issues** - Every error, warning, or problem must be addressed
- **ALWAYS fix issues correctly** - Not just temporarily or partially
- **NEVER take shortcuts** - No workarounds, no "good enough" solutions
- **NEVER assume** - Always verify your fix works as intended
- **Proper formatting is mandatory** - Follow code style, indentation, and conventions exactly
- **Test every fix** - Verify the issue is resolved before moving on


#### What "Fix Correctly" Means:
1. **Understand the root cause** - Don't just fix symptoms
2. **Follow proper patterns** - Use the same patterns as existing code
3. **Maintain consistency** - Code style, naming, structure must match
4. **Validate thoroughly** - Run linters, type checkers, tests, and manual verification
5. **No technical debt** - Don't leave TODOs or temporary fixes
6. **Proper error handling** - Handle edge cases and error conditions

#### Examples of What NOT to Do:
- ❌ Commenting out broken code instead of fixing it
- ❌ Adding `@ts-ignore` or `eslint-disable` to hide issues
- ❌ Partially fixing a problem and leaving related issues
- ❌ Using quick hacks that don't follow project patterns
- ❌ Assuming a fix works without testing it
- ❌ Skipping formatting or linting

### 3. Security First
- NEVER commit secrets, API keys, tokens, or credentials
- ALWAYS check for exposed credentials before committing
- Use environment variables for sensitive data
- Review the `SECURITY_CHECKLIST.md` before every commit

### 4. Pattern Following
- Match existing code style and conventions
- Use the same libraries and patterns already in the codebase
- Follow the established folder structure
- Maintain consistency with existing naming conventions

### 5. Continuous Learning
- Update `CODEBASE_CONTEXT.md` with new learnings
- Document architectural decisions
- Note any gotchas or edge cases discovered
- Build upon previous knowledge

### 6. Pre-commit Validation
Always run before committing:
```bash
npm run lint
npm run build
npm test
```

## Forbidden Actions
- **Skipping or ignoring any issues** (errors, warnings, or problems)
- **Taking shortcuts or making assumptions** without verification
- **Using improper formatting** or inconsistent code style
- Committing `.env` files with real credentials
- Adding large binary files to the repository
- Disabling TypeScript strict checks
- Skipping tests or linting
- Making changes without understanding context
- Using `@ts-ignore`, `eslint-disable`, or similar suppressions to hide issues

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
