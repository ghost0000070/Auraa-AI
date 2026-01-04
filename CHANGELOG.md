# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-01

### Changed

- **Database & Authentication:** Implemented Supabase for database and authentication services.
- **Component Naming:** Renamed components for clarity: `WebsiteIntegrations` and `PuterIntegration`.
- **Environment Variables:** Configured environment variables with `VITE_SUPABASE_*` prefix for Supabase integration.
- **Deployment:** Configured Vercel for production deployments.
- **Documentation:** Updated all documentation to reflect current technology stack.

## [0.2.0] - 2024-07-30

### Added

- **Legal Documents:** Created `terms.html` and `privacy.html` to provide users with essential legal information.
- **Welcome Email:** Implemented a new Cloud Function (`sendWelcomeEmail`) to automatically send a welcome email to new users upon registration, improving the onboarding experience.
- **Not Found (404) Page:** Added a `NotFound.tsx` component and a catch-all route to handle invalid URLs, preventing users from seeing a broken page.
- **SEO & Metadata:** Updated `index.html` with a more descriptive title and a meta description to improve search engine visibility.

### Changed

- **Hosting Configuration:** Updated deployment configuration for the new `/terms` and `/privacy` pages.

## [0.1.0] - 2024-07-29

### Added

- **Core Platform:** Initial setup of the Auraa AI platform with a Vite + React frontend and Supabase backend.
- **Authentication:** Implemented user authentication using Supabase Authentication.
- **AI Employee Deployment:** Core functionality to deploy and manage AI employees.
- **Dashboard & Analytics:** Foundational components for the user dashboard and analytics pages.
- **Business Intelligence & Profile:** Pages for managing business-specific data and profiles.
- **AI Team Management:** Features for AI team coordination and workflow management.
- **Stripe Integration:** Added Stripe for billing and subscription management, including a customer portal.
- **Genkit & Google AI:** Integrated Genkit and Google AI for generative AI capabilities.
- **Puter Integration:** Added integration with Puter.com for script generation.

### Changed

- **Backend Refactoring:** Consolidated multiple AI task-specific cloud functions into a single, more robust `executeAiTask` function.
- **Code Maintainability:** Refactored frontend and backend code to reduce duplication and improve clarity.
- **CI/CD:** Updated GitHub Actions workflow for automated deployments.

### Fixed

- **Critical Security Flaw:** Patched a major security vulnerability in the `deployAiEmployee` function by enforcing user authentication and adding data validation.
- **Subscription Enforcement:** Added a mandatory subscription check before executing paid AI tasks.
- **Storage Rules:** Strengthened database security rules to prevent unauthorized file access.
- **Broken Component References:** Removed references to deleted or modified components in `App.tsx` to prevent application crashes.
- **Removed Debugging Tools:** Deleted the `AITeamDebugger` utility to prevent exposure of sensitive information in production builds.
