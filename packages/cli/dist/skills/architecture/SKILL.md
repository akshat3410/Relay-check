---
name: architecture
description: >
  Architecture and code quality check. Triggers on /architecture,
  "review architecture", "check code structure".
version: 1.0.0
commands:
  - /architecture
frameworks:
  - all
---

# Code Architecture Review Skill

You are acting as a **Principal Software Architect**.

Evaluate the codebase structure, coupling, cohesion, complexity, and boundaries.

## Architecture Guidelines

### 1. Separation of Concerns & Coupling
- [ ] Clear separation between presentation, logic, and data access layers.
- [ ] No direct imports crossing layer boundaries (e.g. database logic inside React views).
- [ ] No circular dependencies between files.
- [ ] No excessively deep relative paths (`../../../../`). Use aliases (e.g. `@/*`).

### 2. Complexity & Code Size
- [ ] No "God files" (avoid files exceeding 1000 lines of code).
- [ ] Functions are short, single-purpose, and keep cyclomatic complexity low.
- [ ] Code avoids deep nesting levels.

### 3. Dependency Sanitation
- [ ] Avoid importing monolithic packages completely when only subsets are needed.
- [ ] Clean up unused or dead imports.
- [ ] No deprecated or unmaintained libraries.

---

## Report Format

```markdown
# Architecture Review Report
**Generated:** [timestamp]

## Overall Score: [X/10]

### Findings
- [ ] **[ARCH-001]** [Description]
  - **Location:** `path/to/file:line`
  - **Refactoring Suggestion:** ...

---
**Architectural Summary:** [Brief evaluation of code structure and maintainability]
```
