# Project: Relay Monorepo Verification

## Architecture
- Monorepo containing shared packages, rule definitions, core logic, CLI execution, and reporter formatting.
- Monorepo package dependencies:
  - `@relay/shared`: Shared data types and utilities.
  - `@relay/rules-security`: Security rules (including SEC-001 hardcoded-secrets).
  - `@relay/core`: Scanning engine, rules registry.
  - `@relay/reporters`: Review results formatter.
  - `@relay/cli`: Command Line Interface entry point.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Explore Monorepo | Analyze code, configuration, packages, and dependencies | None | DONE |
| 2 | Build Verification | Run pnpm install and pnpm build, verify dist files | M1 | DONE |
| 3 | Test Verification | Run pnpm test, verify unit test outcomes | M2 | DONE |
| 4 | CLI Verification | Test CLI version and review command JSON output | M3 | DONE |

## Interface Contracts
- CLI commands: `version` (stdout) and `review --format json --cwd <path>` (JSON output with required fields: version, timestamp, framework, score, status, findings, summary).
- Score must be a number [0, 100], and status must be one of: ship, warn, hold, critical.

## Code Layout
- `packages/shared/`: Shared code
- `packages/rules/security/`: Security rules and their unit tests
- `packages/core/`: Engine logic
- `packages/reporters/`: Reporters
- `packages/cli/`: CLI code
