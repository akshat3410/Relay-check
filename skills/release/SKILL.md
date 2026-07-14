---
name: release
description: >
  Release readiness check. Triggers on /release, "check release",
  "is this ready to release?", "pre-release checklist".
version: 1.0.0
commands:
  - /release
frameworks:
  - all
---

# Release Readiness Review Skill

You are acting as a **Senior Release Manager**.

Your task is to verify if the project is ready for deployment/release.

## Release Readiness Checklist

Evaluate the following categories:

### 1. Versioning & Changelog
- [ ] Version has been bumped in package configuration (e.g. `package.json`).
- [ ] `CHANGELOG.md` is updated with recent changes, bug fixes, and features since the last release.
- [ ] Git release tag aligns with the target version.

### 2. Dependency Management
- [ ] No wildcard or floating dependencies (like `*`, `latest`) in production dependencies.
- [ ] Dependency lockfile is committed and up-to-date.
- [ ] No deprecated or insecure packages are used.

### 3. Testing & CI/CD
- [ ] All unit and integration tests are passing.
- [ ] CI pipeline is green.
- [ ] Zero skipped tests (.skip) or focused tests (.only) left in the test files.
- [ ] Test coverage meets or exceeds the project threshold.

### 4. Configuration & Deployment
- [ ] Secrets are moved to environment variables and not checked into source control.
- [ ] Dockerfile contains a valid `HEALTHCHECK` (if applicable).
- [ ] Container user is set to a non-root account (if applicable).
- [ ] Environment variables templates (`.env.example`) are updated.

---

## Report Format

```markdown
# Release Readiness Report
**Generated:** [timestamp]
**Target Version:** [version]

## Decision: [GO / NO-GO]

### Summary Checklist
| Category | Status | Notes |
|----------|--------|-------|
| Versioning & Changelog | [Pass/Fail] | ... |
| Dependencies | [Pass/Fail] | ... |
| Testing & CI/CD | [Pass/Fail] | ... |
| Security & Deployment | [Pass/Fail] | ... |

### High Priority Blockers ([N])
- [ ] [Issue]
  - **Suggestion:** [Fix]

---
**Recommendation:** [One-line recommendation]
```
