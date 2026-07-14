<div align="center">
  <img src="./assets/relay_banner.jpg" alt="Relay" width="100%" />

  <p>
    <a href="https://www.npmjs.com/package/@relay/cli"><img src="https://img.shields.io/npm/v/@relay/cli.svg?style=flat-square&label=@relay/cli" alt="npm"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT"></a>
    <a href="https://github.com/akshat3410/Relay-check/actions"><img src="https://img.shields.io/github/actions/workflow/status/akshat3410/Relay-check/ci.yml?style=flat-square" alt="CI"></a>
  </p>
</div>

---

**Relay** gives your AI coding assistant a structured review methodology — turning it into a Senior QA Engineer, Security Auditor, Tech Lead, or Release Manager on demand.

It is not a linter. It is not an AI wrapper. It is a set of structured **skills** that tell your AI exactly what to check, how to score it, and how to report it — with a clear `SHIP / HOLD` decision at the end. The AI never invents findings. Everything it reports is backed by evidence: file, line, and a concrete fix.

---

## How It Works

1. **Scan** — Run `relay review` to gather deterministic data about your project. This produces a JSON report.
2. **Load a Skill** — Your AI assistant loads a Relay skill, which gives it a precise review methodology.
3. **Review** — Feed the JSON output to your assistant. It applies the skill's checklist and returns a structured report with a final `SHIP / WARN / HOLD` verdict.

---

## Installation

```bash
npx github:akshat3410/Relay-check
```

Or install permanently so `relay` is always available:

```bash
npm install -g github:akshat3410/Relay-check
```

> **npm package coming soon.** Once published, this will be `npx @relay/cli`.

Then scaffold a config and verify your environment:

```bash
relay init      # creates .relayrc.json in your project root
relay doctor    # validates config and environment
```

---

## Installing Skills

Skills are structured `.md` files that tell your AI assistant how to perform each type of review.

### Automated — recommended

Run this once inside your project:

```bash
relay install-skills
```

Relay detects your AI assistant and writes the skill files to the correct location automatically:

| Assistant | Location |
| :--- | :--- |
| Cursor / Windsurf | `.cursor/rules/relay-*.md` |
| Claude Code | `.claude/skills/relay-*.md` |
| GitHub Copilot | `.github/copilot-instructions.md` (appended) |
| Other agents | `.agents/skills/relay-*.md` |

### Manual

Copy any `.md` file from the [`skills/`](./skills) directory and paste it into your assistant's system prompt, project instructions, or rules file.

---

## Skills

Each skill is triggered by a slash command in your AI assistant's chat.

---

### `/qa` — Full QA Review

**File:** [`skills/qa/SKILL.md`](./skills/qa/SKILL.md) · **CLI:** `relay review`

The most comprehensive review. Covers all categories in a fixed order and produces a weighted score with a `SHIP / WARN / HOLD` decision.

| Category | Weight | Checks |
| :--- | :---: | :--- |
| Security | 30% | OWASP Top 10, secrets in source, auth patterns |
| Testing | 20% | Coverage, assertion quality, skipped tests |
| Architecture | 20% | Coupling, circular deps, God files |
| Performance | 10% | Bundle size, N+1 queries, caching |
| Accessibility | 10% | Semantic HTML, ARIA, keyboard navigation |
| Release Readiness | 10% | Version bump, changelog, CI/CD |

Decision rules: `HOLD` on any critical security issue, score < 50, or zero test coverage. `WARN` at 50–74. `SHIP` at 75+.

---

### `/security` — OWASP Security Audit

**File:** [`skills/security/SKILL.md`](./skills/security/SKILL.md) · **CLI:** `relay security`

Focused entirely on application security. Runs through the full OWASP Top 10: access control, cryptographic failures, injection, insecure design, misconfiguration, vulnerable dependencies, auth failures, data integrity, logging gaps, and SSRF. Returns `SECURE / REVIEW NEEDED / VULNERABLE`.

---

### `/release` — Release Readiness Check

**File:** [`skills/release/SKILL.md`](./skills/release/SKILL.md) · **CLI:** `relay release`

Gates code before it ships. Verifies versioning and changelog, dependency lockfile health, CI/CD status, and deployment configuration (secrets, env vars, Docker). Returns a `GO / NO-GO` with a checklist summary and blockers list.

---

### `/architecture` — Architecture & Code Quality Audit

**File:** [`skills/architecture/SKILL.md`](./skills/architecture/SKILL.md) · **CLI:** `relay architecture`

Evaluates structural health of the codebase. Checks separation of concerns, circular dependencies, coupling, file complexity (God files > 1000 lines), and dependency hygiene. Returns a scored report with per-finding refactoring suggestions.

---

### `/performance` — Performance & Bundle Audit

**File:** [`skills/performance/SKILL.md`](./skills/performance/SKILL.md) · **CLI:** `relay performance`

Identifies frontend and backend performance issues. Checks image optimization, font loading, bundle tree-shaking, code splitting, N+1 query patterns, and caching headers. Returns a score with prioritized action items.

---

### `/testing` — Test Quality & Coverage Verification

**File:** [`skills/testing/SKILL.md`](./skills/testing/SKILL.md) · **CLI:** `relay review --categories testing`

Audits the quality of your test suite — not just coverage. Checks CI integration, placeholder tests, accidentally committed `.only`/`.skip`, assertion quality, and over-mocking patterns.

---

## CLI Reference

```bash
relay init                    # scaffold .relayrc.json
relay doctor                  # validate environment
relay install-skills          # install all skills into your AI assistant
relay review                  # full review, terminal output (default)
relay security                # security audit only
relay release                 # release readiness check
relay architecture            # architecture audit
relay performance             # performance audit
```

---

## Output Formats

```bash
relay review --format terminal                              # rich colored output (default)
relay review --format json                                 # compact JSON for piping into AI or automation
relay review --format markdown                             # GitHub-flavored markdown for PRs
relay review --format html --output report.html            # standalone HTML report
relay review --format sarif --output relay-results.sarif   # SARIF v2.1.0 for GitHub Advanced Security
relay review --format github                               # collapsed PR comment format
```

---

## Contributing

We welcome contributions. See the [Contributing Guide](./docs/CONTRIBUTING.md) to set up the workspace, add rules, or build custom reporters.

MIT © Relay Contributors
