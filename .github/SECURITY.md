# Security Policy

## 🔐 Reporting a Vulnerability

If you discover a security vulnerability in Auraa AI, please report it by emailing the maintainer directly at the email address listed in the repository. Please do not create a public GitHub issue for security vulnerabilities.

### What to Include

Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if you have them)

We will respond to security reports within 48 hours and work with you to understand and address the issue promptly.

---

## 🛡️ Security Best Practices

### Environment Variables

This application requires several environment variables to function correctly. **Never commit sensitive credentials to version control.**

#### Required Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Owner Configuration (for admin access)
VITE_OWNER_EMAIL=your_admin_email
VITE_OWNER_UID=your_admin_user_id

# Polar.sh Configuration (for payment processing)
VITE_POLAR_ACCESS_TOKEN=your_polar_access_token

# Optional: Analytics
VITE_ENABLE_ANALYTICS=true

# Optional: Rate Limiting
VITE_API_RATE_LIMIT=100
```

#### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   - Get Supabase credentials from: https://supabase.com/dashboard
   - Get Polar.sh token from: https://polar.sh/settings
   - Set your admin email and user ID

3. **Never commit `.env`:**
   - The `.env` file is already in `.gitignore`
   - Double-check before committing: `git status`

---

## 🔄 Credential Rotation

If credentials are ever exposed, follow these steps immediately:

### 1. Rotate Supabase Keys

1. Go to https://supabase.com/dashboard
2. Navigate to your project settings
3. Go to **API** section
4. Click **Reset anon key**
5. Update your `.env` file with the new key

### 2. Rotate Polar.sh Token

1. Go to https://polar.sh/settings
2. Navigate to **Access Tokens**
3. Revoke the compromised token
4. Generate a new token
5. Update your `.env` file with the new token

### 3. Update Deployment Environment

If using Vercel:

```bash
# Remove old variables
vercel env rm VITE_SUPABASE_ANON_KEY production
vercel env rm VITE_POLAR_ACCESS_TOKEN production

# Add new variables
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_POLAR_ACCESS_TOKEN production
```

### 4. Redeploy

After rotating credentials, trigger a new deployment to ensure all instances use the new values.

---

## 🚀 Deployment Security

### Vercel Environment Variables

When deploying to Vercel, use their secret management system:

```bash
# Add all required environment variables as secrets
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_POLAR_ACCESS_TOKEN production
vercel env add VITE_OWNER_EMAIL production
vercel env add VITE_OWNER_UID production
```

The `vercel.json` file references these secrets using the `@` prefix (e.g., `@supabase-url`).

### Environment Variable Validation

The application validates required environment variables at startup. If any required variables are missing or invalid, the app will:
- Display a clear error message
- Prevent the app from starting
- Provide setup instructions

This prevents accidentally running the app with missing configuration.

---

## 🔒 Additional Security Measures

### API Rate Limiting

Configure rate limiting to prevent abuse:

```bash
VITE_API_RATE_LIMIT=100  # requests per minute
```

### Error Tracking

For production environments, consider setting up Sentry:

```bash
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
```

### Content Security Policy

The application uses modern security headers. Review `vercel.json` for caching and header configurations.

---

## 📋 Security Checklist

Before deploying to production:

- [ ] All sensitive values are in environment variables (not hardcoded)
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] Production environment variables are set in Vercel
- [ ] Rate limiting is configured appropriately
- [ ] Error tracking is set up (optional but recommended)
- [ ] All dependencies are up to date
- [ ] Security vulnerabilities are addressed (run `npm audit`)

---

## 🔍 Regular Security Audits

Perform regular security checks:

```bash
# Check for dependency vulnerabilities
npm audit

# Fix automatic vulnerabilities
npm audit fix

# Update dependencies
npm update
```

---

## 📞 Contact

For security concerns or questions, please contact the repository maintainer through the email address listed in the repository settings.

---

**Last Updated:** 2026-01-04
