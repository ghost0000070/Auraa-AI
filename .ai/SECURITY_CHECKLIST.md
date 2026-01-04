# Security Checklist

## Pre-Commit Verification

### ❌ Never Commit
- [ ] `.env` files with real values
- [ ] API keys or tokens in source code
- [ ] Private keys or certificates
- [ ] Database connection strings with credentials
- [ ] User passwords or personal data

### ✅ Always Verify
- [ ] Environment variables are in `.env.example` (without real values)
- [ ] Sensitive data uses `process.env` or `import.meta.env`
- [ ] No hardcoded credentials in any file
- [ ] `.gitignore` includes all sensitive file patterns
- [ ] Large binary files are not being committed

### 🔍 Patterns to Search For
Before committing, search the codebase for these patterns:
```
password=
secret=
api_key=
token=
-----BEGIN
sk_live_
pk_live_
eyJ (JWT tokens)
```

### 🚨 If Secrets Are Exposed
1. Immediately rotate/regenerate the exposed credentials
2. Remove the file from git history using BFG or git filter-branch
3. Update `.gitignore` to prevent future commits
4. Notify the team if in a shared repository
