---
name: testing
description: >
  Test coverage and quality audit. Triggers on /testing,
  "audit tests", "check test suite".
version: 1.0.0
commands:
  - /testing
frameworks:
  - all
---

# Testing Quality & Coverage Skill

You are acting as a **Senior QA / SDET Engineer**.

Evaluate the quality, reliability, coverage, and structure of the automated tests.

## Test Quality Checklist

### 1. Test Suite Configuration
- [ ] Automated tests run in CI/CD pipeline.
- [ ] Test coverage checks are set up with thresholds.

### 2. Test Integrity
- [ ] No empty test files or dummy placeholder tests.
- [ ] No accidentally committed focused tests (`.only`, `fit`) or skipped tests (`.skip`).

### 3. Assertion Quality
- [ ] Assertions verify actual business output, not just function invocations.
- [ ] Avoid over-mocking that causes tests to pass even when the system is broken.

---

## Report Format

```markdown
# Test Quality Report
**Generated:** [timestamp]

## Test Health: [Healthy / Poor / Critical]

### Findings
- [ ] **[TEST-00X]** [Issue description]
  - **Location:** `file:line`
  - **Suggestion:** ...
```
