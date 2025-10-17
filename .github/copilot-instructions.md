# AI Agent Instructions for Auraa-AI

This document provides essential guidance for AI agents working on this codebase. Understanding these concepts is crucial for making effective and safe changes.

## 1. Project Architecture: React/Vite Frontend + Supabase Backend

This is a modern web application with two main parts:

1.  **Frontend (`src/`)**: A [React](https://react.dev/) application built with [Vite](https://vitejs.dev/), written in [TypeScript](https://www.typescriptlang.org/).
2.  **Backend (`supabase/`)**: A [Supabase](https://supabase.com/) project providing the database, authentication, and serverless functions.

The frontend and backend are tightly integrated but managed in separate directories.

## 2. Backend Workflow: Supabase CLI is Essential

All backend development (database, serverless functions) is managed via the Supabase CLI. **Do not use `docker-compose` directly.**

### Local Development

1.  **Start the Supabase stack**: This command spins up the local database, auth, and function services.
    ```bash
    supabase start
    ```

2.  **Apply Database Migrations**: After creating or modifying a migration, you must reset the local database to apply all migrations in order. **Warning**: This command deletes all local data.
    ```bash
    supabase db reset
    ```

### Database Migrations (`supabase/migrations/`)

-   **Structure**: Migrations are SQL files with a timestamp prefix (e.g., `20250819090000_create_user_roles.sql`). The timestamp determines the execution order.
-   **Creating Migrations**: To create a new migration file, use the CLI:
    ```bash
    supabase migration new <a_descriptive_name>
    ```
-   **Idempotency**: Write migrations to be idempotent (e.g., use `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`). This prevents errors when re-running `supabase db reset`.
-   **Row-Level Security (RLS)**: RLS is enabled on most tables. **Always define RLS policies when creating a new table.** Policies often depend on the `public.user_roles` table to grant permissions (e.g., for an 'admin' role). See `supabase/migrations/20250910120000_add_missing_core_tables.sql` for examples.

### Serverless Functions (`supabase/functions/`)

-   These are TypeScript-based edge functions for secure backend logic (e.g., payment processing, AI model calls).
-   Each sub-directory in `supabase/functions/` is a separate function.
-   They are invoked from the frontend using the Supabase client library.

## 3. Frontend Workflow: React & Vite

The frontend is a standard Vite-based React application.

-   **Setup**:
    ```bash
    npm install
    ```
-   **Run Development Server**:
    ```bash
    npm run dev
    ```

### Key Frontend Concepts

-   **UI Components (`src/components/`)**: The app uses `shadcn/ui` components, which are found in `src/components/ui`. These are styled with Tailwind CSS. Custom, more complex components are in the root of `src/components/`.
-   **Authentication (`src/hooks/useAuth.tsx`)**: Auth is handled by `supabase.auth`. The `useAuth` hook provides user state to the application.
-   **Protected Routes (`src/components/ProtectedRoute.tsx`)**: This component wraps pages that require a logged-in user.
-   **Subscription Management (`src/components/SubscriptionGuard.tsx`)**: This component likely checks the user's subscription status (from the `subscribers` table) to control access to paid features.

## 4. Key Conventions & Patterns

-   **Admin Role**: A user with the role 'admin' in the `public.user_roles` table has elevated privileges, defined by RLS policies in the database migrations. Seeding the first admin user is a critical step handled in the migrations.
-   **Styling**: All styling is done with Tailwind CSS. The configuration is in `tailwind.config.ts`.
-   **Environment Variables**: Supabase URL and anon key are managed by Supabase. For other keys, use the `.env` file mechanism provided by Vite.
