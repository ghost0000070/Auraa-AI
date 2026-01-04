# Auraa-AI Codebase Context

> This is a living document. AI agents should update this file as they learn about the codebase.

## Project Overview
Auraa-AI is a business automation platform built with React, TypeScript, and Supabase.

## Last Updated
2026-01-04

## Key Learnings

### Architecture
- Uses Vite for fast development and building
- Supabase for backend (auth, database, storage)
- Radix UI primitives with shadcn/ui component library
- TanStack Query for server state management

### Important Files
- `src/` - Main application source code
- `supabase/` - Database migrations and edge functions
- `components.json` - shadcn/ui configuration

### Conventions
- Path alias: `@/` maps to `src/`
- Environment variables prefixed with `VITE_`
- Components use TypeScript with strict typing

### Known Issues
- (Document any issues discovered here)

### API Integrations
- Supabase: Authentication, database, storage
- Stripe: Payment processing
- Polar.sh: Additional payment/subscription handling
- Google Generative AI: AI features

## Changelog
- 2026-01-04: Initial context document created
