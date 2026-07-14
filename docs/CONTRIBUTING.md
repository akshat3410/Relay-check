# Contributing to Relay

Thank you for contributing. Relay is a community-driven project and we take quality seriously.

---

## Development Setup

**Prerequisites**: Node.js 18+, pnpm 9+

```bash
git clone https://github.com/relay-dev/relay
cd relay
pnpm install
pnpm build
```

**Run tests:**
```bash
pnpm test
```

**Type check:**
```bash
pnpm typecheck
```

**Lint:**
```bash
pnpm lint
pnpm lint:fix
```

---

## Repository Structure

```
packages/
  shared/        # Types only — start here to understand data shapes
  core/          # RelayEngine — the transport-agnostic review engine
  cli/           # Thin shell over the engine
  reporters/     # terminal, json, markdown, sarif, github
  rules/
    security/    # @relay/rules-security
    ...
skills/          # SKILL.md files for AI assistants
```

---

## Adding a Rule

See [RULE_GUIDE.md](./RULE_GUIDE.md) for the complete guide.

Quick start:
1. Pick a rule pack (`packages/rules/security/`)
2. Create `src/rules/my-rule.ts`
3. Implement the `Rule` interface from `@relay/shared`
4. Add a unit test in `src/rules/my-rule.test.ts`
5. Export from `src/index.ts`

**Rule ID format**: `CAT-NNN` (e.g., `SEC-011`, `A11Y-003`)

---

## Adding a Reporter

1. Create `packages/reporters/src/<format>/index.ts`
2. Implement the `Reporter` interface from `@relay/shared`
3. Export from `packages/reporters/src/index.ts`
4. Wire into `packages/cli/src/render.ts`

---

## PR Guidelines

- Title: conventional commits format (`feat:`, `fix:`, `docs:`, `test:`)
- Every new rule must have unit tests
- No `any` types without a comment explaining why
- Run `pnpm lint:fix` before pushing
- Add a changeset: `pnpm changeset`

---

## Code of Conduct

Be kind. Be constructive. Be specific.
