---
name: security
description: >
  Security audit. Triggers on /security, "audit security", "check for vulnerabilities",
  "is this secure?", "OWASP review".
version: 1.0.0
commands:
  - /security
frameworks:
  - all
---

# Security Review Skill

You are acting as a **Senior Application Security Engineer**.

Perform a structured security audit of this project based on the OWASP Top 10.

## OWASP Top 10 Checklist

For each item, evaluate: **Pass / Fail / Not Applicable / Needs Review**

### A01: Broken Access Control
- [ ] Authorization checks on all protected routes
- [ ] No IDOR vulnerabilities (user can only access their own data)
- [ ] Principle of least privilege applied
- [ ] Directory traversal prevention

### A02: Cryptographic Failures
- [ ] HTTPS enforced (no HTTP in production config)
- [ ] Secrets not hardcoded in source
- [ ] .env files in .gitignore
- [ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- [ ] JWT secrets are strong and rotated

### A03: Injection
- [ ] No eval() or new Function() with user input
- [ ] No SQL string concatenation
- [ ] Parameterized queries or ORM used
- [ ] Input validation on all user-supplied data

### A04: Insecure Design
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Sensitive operations require re-authentication

### A05: Security Misconfiguration
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Debug mode disabled in production
- [ ] Error messages don't expose stack traces
- [ ] Default credentials changed

### A06: Vulnerable and Outdated Components
- [ ] Lockfile committed
- [ ] No wildcard dependency versions
- [ ] No known CVEs in dependencies (run: pnpm audit)

### A07: Identification and Authentication Failures
- [ ] Strong password policy
- [ ] Multi-factor authentication available
- [ ] Session tokens invalidated on logout
- [ ] Secure, HttpOnly cookies for session storage

### A08: Software and Data Integrity Failures
- [ ] Subresource Integrity (SRI) for CDN resources
- [ ] Dependency integrity verified (lockfile)
- [ ] No deserialization of untrusted data

### A09: Security Logging and Monitoring Failures
- [ ] Authentication events logged
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Log retention policy defined
- [ ] Alerts configured for suspicious activity

### A10: Server-Side Request Forgery (SSRF)
- [ ] User-supplied URLs validated before fetch
- [ ] Allowlist of permitted external domains
- [ ] Internal network access blocked from user-controlled requests

---

## Report Format

```
# Security Review Report
**Generated:** [timestamp]
**Framework:** [detected]

## Overall: [SECURE / REVIEW NEEDED / VULNERABLE]

### OWASP Results
| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ✅ Pass | ... |
...

### Critical Vulnerabilities ([N])
[list with evidence and fix]

### Risk Analysis
[narrative]

### Immediate Actions Required
1. [action]
```
