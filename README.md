<div align="center">
  <img src="./assets/relay_banner.jpg" alt="Relay" width="100%" />

  <p>
    <a href="https://www.npmjs.com/package/@akshatdev/relay"><img src="https://img.shields.io/npm/v/@akshatdev/relay?style=flat-square&color=blue" alt="npm version"></a>
    <a href="https://github.com/akshat3410/Relay-check"><img src="https://img.shields.io/github/stars/akshat3410/Relay-check?style=flat-square&label=stars" alt="GitHub Stars"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT"></a>
  </p>
</div>

---

**Relay** equips your AI coding assistant with a multidisciplinary software & brand engineering system — turning it into a Senior QA Engineer, Security Auditor, Brand Strategist, Tech Lead, or Release Manager on demand.

Relay provides a suite of highly optimized **Agent-Native Skills & Workflows** that install directly into your AI developer assistant (Claude Code, Google Antigravity, Cursor, or GitHub Copilot) as native slash commands.

From **scientific brand strategy & advertising psychology** to **OWASP security audits & release gating**, Relay provides structured decision frameworks for the entire software creation lifecycle.

---

## 🚀 Quick Start

Run the automated installer inside any project directory:

```bash
npx @akshatdev/relay install-skills
```

By default, Relay automatically installs all skills **locally** (for the current workspace) and **globally** (across your machine) for all detected assistant providers.

---

## ⚡ Assistant Integrations

| Assistant | Local Slash Command / Workflow Path | Global Installation Path |
| :--- | :--- | :--- |
| **Claude Code** | `/relay-<skill>` via `.claude/commands/` | `~/.claude/commands/` |
| **Google Antigravity** | `/relay-<skill>` via `.agents/workflows/` | `~/.gemini/config/global_workflows/` |
| **Cursor** | Persisted rules under `.cursor/rules/` | Persistent instructions |
| **GitHub Copilot** | Appended to `.github/copilot-instructions.md` | Persistent prompts |

---

## 🎨 Brand & Product Experience System

### 💎 `/relay-brand` (`/relay-brand-experience`, `/relay-ibe`) — Integrated Brand Experience
A 22-stage design operating system that transforms a business idea or product into a cohesive digital experience by fusing **Marketing Strategy**, **Human Psychology**, **Visual/Brand Identity**, and **Web/Interaction Design**.

Grounded in peer-reviewed cognitive neuroscience, advertising psychology, and visual storytelling research:
- **Norman’s Tri-Level Emotional Processing** (Visceral, Behavioral, Reflective)
- **Ramachandran’s Peak Shift Principle** & Neuroaesthetics
- **Fauconnier & Turner’s Conceptual Blending** for Dual-Storytelling Logos
- **Jonah Berger’s STEPPS & Arousal Theory** for Virality
- **Mandler’s Schema Incongruity** & Processing Fluency

```
BRAND → HUMAN INSIGHT → MARKETING STRATEGY → PSYCHOLOGY → CREATIVE CONCEPT → VISUAL IDENTITY → LOGO / SYMBOL → WEB EXPERIENCE → INTERACTION → EMOTION → MEMORY → BEHAVIOR → CONVERSION → BUSINESS OUTCOME
```

---

## 🛠️ Code Audit & Quality Skills

Every skill is structured as an agent-native instruction set and can be invoked natively using slash commands in your AI assistant's chat interface.

### 📋 `/relay-qa` — Full Project QA Audit
Evaluates code quality, security, performance, accessibility, and release readiness to calculate a weighted score `[0-100]` and output a definitive `SHIP / WARN / HOLD` decision.

| Category | Weight | Focus Areas |
| :--- | :---: | :--- |
| **Security** | 30% | OWASP Top 10, secrets in source code, input validation |
| **Testing** | 20% | Coverage, assertion quality, focused/skipped tests |
| **Architecture** | 20% | Layering, cohesion, circular dependencies, God files |
| **Performance** | 10% | Bundle tree-shaking, lazy-loading, N+1 query patterns |
| **Accessibility** | 10% | Semantic HTML, ARIA labels, keyboard focus states |
| **Release Readiness** | 10% | Version verification, changelogs, configuration templates |

---

### 🛡️ `/relay-security` — OWASP Security Audit
An intensive security assessment mapped directly against OWASP Top 10 vulnerabilities (including injection, broken access control, cryptographic failures, and insecure design). Returns `SECURE / REVIEW NEEDED / VULNERABLE`.

---

### 🚀 `/relay-release` — Release Readiness Check
Gates your code before shipping. Verifies dependency lockfile health, floating production dependencies, changelog entries, version increments, container user privileges, and environment variable templates. Returns a clear `GO / NO-GO` verdict.

---

### ⚡ `/relay-performance` — Performance Audit
Identifies frontend and backend bottlenecks. Audits asset lazy-loading, dynamic importing, monolithic library tree-shaking, HTTP caching headers, and database query pagination.

---

### 🧪 `/relay-testing` — Test Quality Verification
Audits test suite reliability and coverage. Flags accidentally committed `.only`/`.skip` focus markers, empty test files, dummy placeholder assertions, and brittle over-mocking patterns.

---

### 🏗️ `/relay-architecture` — Code Architecture Audit
Evaluates structural health and separation of concerns. Flags monolithic dependencies, circular imports, deep relative paths (`../../../../`), and bloated files exceeding 1000 lines of code.

---

## 💻 CLI Usage & CI Integration

Relay maintains full CLI compatibility for automated CI/CD pipelines and headless workflows:

```bash
# Print current Relay CLI version
relay version

# Run a structured review and export JSON results
relay review --format json --cwd .
```

---

## 🤝 Contributing

Contributions are welcome! Check out our [Contributing Guide](./docs/CONTRIBUTING.md) to get started.

MIT License © Relay Contributors
