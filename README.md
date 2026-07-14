<div align="center">
  <img src="./assets/relay_banner.jpg" alt="Relay Banner" width="100%" />

  <h1>⚡ Relay</h1>
  <p><strong>Professional Review Platform for AI Coding Assistants. QA, Security, Release, and Architecture — One Engine, Zero Halos.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@relay/cli"><img src="https://img.shields.io/npm/v/@relay/cli.svg?style=flat-square&label=@relay/cli" alt="npm version"></a>
    <a href="https://github.com/relay-dev/relay/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://github.com/relay-dev/relay/actions"><img src="https://img.shields.io/github/actions/workflow/status/relay-dev/relay/ci.yml?style=flat-square" alt="CI"></a>
  </p>
</div>

---

> **Relay is not another linter. It is not an AI wrapper.**
>
> Relay bridges the gap between deterministic static analysis and qualitative AI reviews. It provides structured methodology ("skills") and execution metrics that make AI coding assistants behave like Senior QA Engineers, Tech Leads, and Security Auditors.

---

## 🚀 How it Works

1. **Deterministic Scan**: Run `relay review` via CLI to gather clean, verified data.
2. **Skill Prompting**: Load a Relay `.md` skill into your AI assistant.
3. **Structured Review**: Feed the CLI's JSON report into your assistant. The AI evaluates the findings, executes the skill's specific checklist, and renders a standard report with a clear **SHIP/HOLD** decision.

---

## 📦 Installation & Setup

### 1. Install the CLI
Install Relay globally or as a project dev-dependency:

```bash
# Globally
npm install -g @relay/cli

# Or per-project (recommended)
pnpm add -D @relay/cli
```

### 2. Initialize Config
Scaffold a default config file (`.relayrc.json`) in your project root:
```bash
relay init
```

### 3. Diagnose Setup
Run a doctor diagnostic to ensure the environment is valid:
```bash
relay doctor
```

---

## 🧠 Installing Skills in AI Assistants

To make your AI assistant follow the Relay methodology, load the corresponding `SKILL.md` rules into its instructions.

| Assistant | How to Install |
| :--- | :--- |
| **Cursor / Windsurf** | Copy the text of a skill and append it to your `.cursorrules` or `.windsurfrules` file. |
| **Claude Projects** | Upload the skill's `.md` file to your project's **Custom Instructions** or **Project Knowledge**. |
| **Copilot / ChatGPT** | Save the skill's `.md` file in your repository under `.github/copilot-instructions.md` or paste it directly in the system prompt instructions. |

---

## 🛠️ Slash Commands

Use these commands directly in your AI assistant prompt to initiate specific reviews:

### `/qa` — Full Quality Assurance Review
Triggers a complete audit across all categories. Checks security, test coverage, code structure, performance, and release metadata.
- **Workflow file**: [`skills/qa/SKILL.md`](./skills/qa/SKILL.md)
- **CLI equivalent**: `relay review`

### `/security` — OWASP Top 10 Audit
Focuses entirely on security vulnerabilities, hardcoded secrets, input sanitization, dynamic code execution, and secure configuration.
- **Workflow file**: [`skills/security/SKILL.md`](./skills/security/SKILL.md)
- **CLI equivalent**: `relay security`

### `/release` — Release Readiness Check
Gates code changes before shipping to production. Verifies version bumps, changelog updates, and test suite integrity.
- **Workflow file**: [`skills/release/SKILL.md`](./skills/release/SKILL.md)
- **CLI equivalent**: `relay release`

### `/architecture` — Clean Code & Coupling Audit
Evaluates project modularity. Detects high coupling, circular references, God files, and deprecated APIs.
- **Workflow file**: [`skills/architecture/SKILL.md`](./skills/architecture/SKILL.md)
- **CLI equivalent**: `relay architecture`

### `/performance` — Performance & Bundle Size Audit
Identifies large monolithic imports (like Moment or Lodash), unoptimized asset tags, and client-side rendering bottlenecks.
- **Workflow file**: [`skills/performance/SKILL.md`](./skills/performance/SKILL.md)
- **CLI equivalent**: `relay performance`

### `/testing` — Test Quality & Coverage Verification
Analyzes test suite configurations, placeholder tests, skipped/focused tests (`.only` / `.skip`), and assertion validity.
- **Workflow file**: [`skills/testing/SKILL.md`](./skills/testing/SKILL.md)
- **CLI equivalent**: `relay review --categories testing`

---

## 📊 CLI Formatting Options

You can render Relay results in multiple presentation layers depending on your environment:

```bash
# Rich colored terminal UI (default)
relay review --format terminal

# Compact JSON for automation / MCP tool integration
relay review --format json

# Github-flavored markdown for pipelines
relay review --format markdown

# Clean Standalone HTML page with tailored statistics
relay review --format html --output report.html

# SARIF v2.1.0 for GitHub Advanced Security Scanning
relay review --format sarif --output relay-results.sarif

# Collapsed PR summary comment format
relay review --format github
```

---

## ⚡ Core Philosophy: Trust-First

Relay enforces a **read-only analysis policy** in `v1`. 

* **No Automatic Code Modification**: The engine identifies findings, provides line evidence, explains risks, and suggests fixes—but it never modifies your files automatically.
* **Why?** Trust in analysis must precede automation. Once developers trust the recommendations, V2 will introduce AI-generated fix recommendations, and V3 will introduce `relay fix` with an explicit approval terminal.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) to set up the workspace, add rules, or build custom reporters.

MIT © Relay Contributors
