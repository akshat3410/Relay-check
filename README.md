<div align="center">
  <img src="./assets/relay_banner.jpg" alt="Relay" width="100%" />

  <p>
    <a href="https://www.npmjs.com/package/@relay/cli"><img src="https://img.shields.io/npm/v/@relay/cli.svg?style=flat-square&label=@relay/cli" alt="npm"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT"></a>
  </p>
</div>

**Relay** gives your AI coding assistant a structured review methodology — turning it into a Senior QA Engineer, Security Auditor, or Tech Lead on demand.

---

## Install

```bash
npm install -g @relay/cli
```

Then scaffold a config and verify your environment:

```bash
relay init
relay doctor
```

---

## Install Skills

Run this once inside any project to load all Relay skills into your AI assistant automatically:

```bash
relay install-skills
```

This detects which assistant you are using (Cursor, Claude Code, Copilot, etc.) and writes the correct skill files to the right location. No manual copy-paste needed.

---

## Skills

| Slash Command | What it does |
| :--- | :--- |
| `/qa` | Full audit — security, tests, structure, performance, release metadata |
| `/security` | OWASP Top 10 scan — secrets, injection, unsafe config |
| `/release` | Pre-ship gate — version bump, changelog, test suite |
| `/architecture` | Coupling, circular deps, God files, deprecated APIs |
| `/performance` | Bundle size, unoptimized assets, render bottlenecks |
| `/testing` | Coverage, placeholder tests, skipped/focused tests |

---

## CLI Review

Run a scan and pipe the results into your AI assistant:

```bash
# Default — rich terminal output
relay review

# JSON — for piping into AI or automation
relay review --format json

# Markdown — for PRs and pipelines
relay review --format markdown

# HTML report
relay review --format html --output report.html

# SARIF — for GitHub Advanced Security
relay review --format sarif --output relay-results.sarif

# GitHub PR comment format
relay review --format github
```

---

## How It Works

1. Run `relay review` to get a clean, deterministic scan of your codebase.
2. Your AI assistant reads the findings using the loaded skill.
3. It applies the skill's checklist and returns a structured report with a **SHIP / HOLD** decision.

Relay never modifies your code. It reads, reports, and recommends.

---

MIT © Relay Contributors
