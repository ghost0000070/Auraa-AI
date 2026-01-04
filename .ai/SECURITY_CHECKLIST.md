# Security Checklist

## ⚠️ CRITICAL: Never Skip Issues
**This checklist must be completed for EVERY commit. No exceptions. No shortcuts.**

## Pre-Commit Verification

### ❌ Never Commit
- [ ] `.env` files with real values
- [ ] API keys or tokens in source code
- [ ] Private keys or certificates
- [ ] Database connection strings with credentials
- [ ] User passwords or personal data
- [ ] Hardcoded secrets of any kind

### ✅ Always Verify
- [ ] Environment variables are in `.env.example` (without real values)
- [ ] Sensitive data uses `process.env` or `import.meta.env`
- [ ] No hardcoded credentials in any file
- [ ] `.gitignore` includes all sensitive file patterns
- [ ] Large binary files are not being committed
- [ ] All security patterns below have been searched for and found NONE

### 🔍 Patterns to Search For
Before committing, search the codebase for these patterns and **FIX ANY MATCHES** (do not skip):
```
password=
secret=
api_key=
token=
-----BEGIN
sk_live_
pk_live_
eyJ (JWT tokens)
AKIA (AWS access keys)
private_key
client_secret
```

### 🔧 Code Quality (Never Skip)
- [ ] All linting errors are fixed (not disabled or ignored)
- [ ] All type errors are resolved (no @ts-ignore used)
- [ ] All tests pass
- [ ] Build completes without errors or warnings
- [ ] Code follows project formatting standards exactly
- [ ] No TODO comments for security issues
- [ ] No commented-out code to "hide" problems

### 🚨 If Secrets Are Exposed
1. **STOP IMMEDIATELY** - Do not proceed with commit
2. Immediately rotate/regenerate the exposed credentials
3. Remove the secrets from the code properly
4. Remove the file from git history using BFG or git filter-branch
5. Update `.gitignore` to prevent future commits
6. Notify the team if in a shared repository
7. Document the incident in CODEBASE_CONTEXT.md

### 📋 Final Pre-Commit Checklist
Before running `git commit`, verify:
- [ ] I have run `npm run lint` and fixed ALL issues
- [ ] I have run `npm run build` and it completes successfully
- [ ] I have run `npm test` and all tests pass
- [ ] I have searched for security patterns and found NONE
- [ ] I have NOT used any shortcuts (@ts-ignore, eslint-disable, etc.)
- [ ] I have NOT skipped any issues
- [ ] All code is properly formatted and follows conventions
- [ ] I understand what my changes do and why they work
