<div align="center">
  <img src="./assets/relay_banner.jpg" alt="Relay" width="100%" />

  <p>
    <a href="https://www.npmjs.com/package/@relay/cli"><img src="https://img.shields.io/npm/v/@relay/cli.svg?style=flat-square&label=@relay/cli" alt="npm"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT"></a>
    <a href="https://github.com/akshat3410/Relay-check/actions"><img src="https://img.shields.io/github/actions/workflow/status/akshat3410/Relay-check/ci.yml?style=flat-square" alt="CI"></a>
  </p>
</div>

---

**Relay** bridges the gap between deterministic static analysis and qualitative AI reviews. It gives your AI coding assistant a structured methodology — turning it into a Senior QA Engineer, Security Auditor, Tech Lead, or Release Manager on demand.

Relay is not another linter. It is not an AI wrapper. It is a set of structured **skills** (review workflows) that tell your AI assistant exactly how to think, what to check, and how to report — with a clear `SHIP / HOLD` decision at the end.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Installation](#installation)
- [Installing Skills into Your AI Assistant](#installing-skills-into-your-ai-assistant)
- [Skills Reference](#skills-reference)
- [CLI Commands](#cli-commands)
- [Output Formats](#output-formats)
- [Core Philosophy](#core-philosophy)
- [Contributing](#contributing)

---

## How It Works

Relay works in three steps:

1. **Scan** — Run `relay review` to gather clean, deterministic data about your project (dependencies, config, test files, patterns). This produces a JSON report.
2. **Load a Skill** — Your AI assistant loads a Relay skill, which gives it a precise review methodology (what to check, how to score, how to report).
3. **Review** — Feed the CLI's JSON output to your assistant. It applies the skill's checklist against the data, evaluates findings, and produces a structured report with a final **SHIP / WARN / HOLD** decision.

The key principle: the AI never invents findings. It only reports what it can verify with evidence — file name, line number, and a concrete fix.

---

## Installation

### 1. Install the CLI

Install Relay globally or as a project dev-dependency:

```bash
# Globally
npm install -g @relay/cli

# Per-project (recommended)
pnpm add -D @relay/cli
```

### 2. Initialize Config

Scaffold a `.relayrc.json` configuration file in your project root:

```bash
relay init
```

This creates a default config that you can customize to set thresholds, ignored paths, and active skill categories.

### 3. Verify Your Environment

Run the doctor command to confirm Relay is set up correctly:

```bash
relay doctor
```

This checks that the config file is valid, required tools are installed, and the environment is ready for review.

---

## Installing Skills into Your AI Assistant

Skills are the core of Relay. Each skill is a structured `.md` file that tells your AI assistant how to perform a specific type of review.

### Automated (Recommended)

Run this command once inside your project:

```bash
relay install-skills
```

Relay automatically detects which AI assistant you are using and writes the skill files to the correct location. Supported assistants:

| Assistant | Files Written |
| :--- | :--- |
| **Cursor / Windsurf** | `.cursor/rules/relay-*.md` |
| **Claude Code** | `.claude/skills/relay-*.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` (appended) |
| **Generic / Other** | `.agents/skills/relay-*.md` |

No manual copy-paste needed. After running the command, your AI assistant will automatically pick up the skills from the next session.

### Manual

If you prefer to install skills manually, copy the content of any `.md` file from the [`skills/`](./skills) directory and paste it into your assistant's system prompt, project instructions, or rules file.

---

## Skills Reference

Each skill is triggered by a slash command in your AI assistant's chat. Below is the full reference for every skill Relay ships with.

---

### `/qa` — Full QA Review

**File:** [`skills/qa/SKILL.md`](./skills/qa/SKILL.md)

The most comprehensive review Relay offers. Your AI will act as a Senior QA Engineer, Tech Lead, and Release Manager simultaneously. It runs through every category in a fixed order and produces a weighted score.

**What it checks:**

| Category | Weight | What it evaluates |
| :--- | :---: | :--- |
| Security | 30% | OWASP Top 10, secrets in source, auth patterns |
| Testing | 20% | Coverage, assertion quality, skipped tests |
| Architecture | 20% | Coupling, circular deps, God files |
| Performance | 10% | Bundle size, N+1 queries, caching |
| Accessibility | 10% | Semantic HTML, ARIA, keyboard navigation |
| Release Readiness | 10% | Version bump, changelog, CI/CD status |

**Ship decision rules:**

| Condition | Decision |
| :--- | :--- |
| Any critical security issue | `HOLD` |
| Overall score < 50 | `HOLD` |
| No test coverage | `HOLD` |
| Score 50–74 with warnings | `WARN` |
| Score 75+ with no critical issues | `SHIP` |

**CLI equivalent:** `relay review`

---

### `/security` — OWASP Security Audit

**File:** [`skills/security/SKILL.md`](./skills/security/SKILL.md)

Focuses entirely on application security. Your AI will act as a Senior Application Security Engineer and run through the full OWASP Top 10 checklist.

**What it checks:**

- **A01 Broken Access Control** — authorization checks, IDOR vulnerabilities, least privilege
- **A02 Cryptographic Failures** — HTTPS enforcement, hardcoded secrets, `.env` in `.gitignore`, password hashing
- **A03 Injection** — `eval()` usage, SQL string concatenation, missing input validation
- **A04 Insecure Design** — rate limiting on auth endpoints, account lockout
- **A05 Security Misconfiguration** — security headers (CSP, X-Frame-Options), debug mode in production, exposed stack traces
- **A06 Vulnerable Components** — lockfile committed, no wildcard versions, known CVEs (`pnpm audit`)
- **A07 Auth Failures** — session invalidation on logout, HttpOnly cookies, MFA
- **A08 Data Integrity Failures** — SRI for CDN resources, no unsafe deserialization
- **A09 Logging Failures** — no sensitive data in logs, authentication events logged
- **A10 SSRF** — user-supplied URL validation, allowlists for external domains

**CLI equivalent:** `relay security`

---

### `/release` — Release Readiness Check

**File:** [`skills/release/SKILL.md`](./skills/release/SKILL.md)

Gates your code before it ships to production. Your AI acts as a Senior Release Manager and verifies every pre-release checklist item.

**What it checks:**

- **Versioning & Changelog** — version bumped in `package.json`, `CHANGELOG.md` updated, git tag aligned
- **Dependencies** — no wildcard versions (`*`, `latest`), lockfile committed, no deprecated packages
- **Testing & CI/CD** — all tests passing, CI green, no `.skip` or `.only` left in test files
- **Configuration & Deployment** — secrets in env vars, `.env.example` updated, Docker HEALTHCHECK and non-root user (if applicable)

**Output:** A `GO / NO-GO` decision with a checklist summary and list of blockers.

**CLI equivalent:** `relay release`

---

### `/architecture` — Architecture & Code Quality Audit

**File:** [`skills/architecture/SKILL.md`](./skills/architecture/SKILL.md)

Evaluates how well the codebase is structured. Your AI acts as a Principal Software Architect and looks for structural debt.

**What it checks:**

- **Separation of Concerns** — no database logic inside views, no boundary violations between layers
- **Circular Dependencies** — detects circular import chains between modules
- **Coupling** — deep relative paths (`../../../../`), missing path aliases
- **File Complexity** — files exceeding 1000 lines, high cyclomatic complexity, deep nesting
- **Dependency Hygiene** — unused imports, importing full monolithic packages instead of subsets

**Output:** A scored architecture report with per-finding refactoring suggestions.

**CLI equivalent:** `relay architecture`

---

### `/performance` — Performance & Bundle Audit

**File:** [`skills/performance/SKILL.md`](./skills/performance/SKILL.md)

Identifies performance bottlenecks across frontend bundle and backend data access. Your AI acts as a Senior Performance Engineer.

**What it checks:**

- **Images** — unoptimized `<img>` tags, missing `loading="lazy"`, no `srcset`
- **Fonts** — missing `font-display: swap`
- **Bundle** — full `lodash`/`moment` imports instead of tree-shaken subsets, dev dependencies in production
- **Code Splitting** — large components not using dynamic imports
- **Database** — N+1 query patterns, missing pagination, no HTTP caching headers

**Output:** A performance score with prioritized action items and reasoning for each.

**CLI equivalent:** `relay performance`

---

### `/testing` — Test Quality & Coverage Verification

**File:** [`skills/testing/SKILL.md`](./skills/testing/SKILL.md)

Audits the quality and reliability of your test suite. Your AI acts as a Senior QA / SDET Engineer.

**What it checks:**

- **CI Integration** — are tests actually running in CI? Are coverage thresholds enforced?
- **Test Integrity** — empty test files, placeholder tests with no assertions
- **Focused/Skipped Tests** — accidentally committed `.only`, `fit`, or `.skip` that silently exclude tests
- **Assertion Quality** — tests that verify business output vs. tests that just check function calls were made
- **Over-mocking** — mock-heavy tests that pass even when the real system is broken

**CLI equivalent:** `relay review --categories testing`

---

## CLI Commands

```bash
# Initialize config in the current project
relay init

# Check environment setup
relay doctor

# Run a full review (default: terminal output)
relay review

# Install skills into your AI assistant automatically
relay install-skills

# Run a targeted review
relay security
relay release
relay architecture
relay performance
```

---

## Output Formats

All `relay review` commands support multiple output formats:

```bash
# Rich colored terminal output (default)
relay review --format terminal

# Compact JSON — pipe into AI assistants or automation
relay review --format json

# GitHub-flavored Markdown — for PR descriptions and pipelines
relay review --format markdown

# Standalone HTML report with charts
relay review --format html --output report.html

# SARIF v2.1.0 — for GitHub Advanced Security scanning
relay review --format sarif --output relay-results.sarif

# Collapsed PR comment format
relay review --format github
```

---

## Core Philosophy

Relay enforces a **read-only analysis policy** in v1.

- **No automatic code modification.** Relay identifies findings, provides line-level evidence, explains the risk, and suggests a fix — but it never touches your files.
- **Evidence-first reporting.** Every finding must point to a specific file and line. Vague, invented warnings are not acceptable.
- **Trust before automation.** Once developers trust the recommendations, v2 will introduce AI-generated fix suggestions. v3 will introduce `relay fix` with an explicit approval terminal.

---

## Contributing

We welcome contributions. See the [Contributing Guide](./docs/CONTRIBUTING.md) to learn how to set up the workspace, add new rules, or build custom reporters.

MIT © Relay Contributors
