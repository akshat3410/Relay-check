# Handoff Report: Monorepo Structure, Dependencies, and Configuration Audit

## Summary
The Relay monorepo is successfully structured with `pnpm` workspaces and `turborepo` but suffers from several critical build, test, and CLI configuration issues. Most notably, a broken import in the SEC-001 test file prevents any test or typecheck from passing, and missing dependency/CLI configurations prevent the security rule pack from being packaged or configured correctly in production.

---

## 1. Observation

### Monorepo Structure & Package Details
The monorepo contains 5 workspace packages managed via `pnpm-workspace.yaml`:
1. **`@relay/shared`** (`packages/shared`): Type-only package containing core structures (`ProjectContext`, `Finding`, etc.) with zero runtime dependencies.
2. **`@relay/rules-security`** (`packages/rules/security`): Rule pack implementing 10 security checks.
3. **`@relay/reporters`** (`packages/reporters`): Output formatters (`TerminalReporter`, `JsonReporter`, `MarkdownReporter`).
4. **`@relay/core`** (`packages/core`): The core scan logic and engine (`RelayEngine`, `PluginRegistry`, `FrameworkDetector`, etc.).
5. **`@relay/cli`** (`packages/cli`): The command-line entry point.

### SEC-001 Hardcoded Secrets Unit Tests Location
Directly observed the unit tests for **SEC-001 hardcoded-secrets** in the file `packages/rules/security/src/rules/hardcoded-secrets.test.ts`. 

On line 2 of `packages/rules/security/src/rules/hardcoded-secrets.test.ts`:
```typescript
import { hardcodedSecretsRule } from '../src/rules/hardcoded-secrets.js';
```

### Dependency Configuration Errors
1. **Built-in Pack Inclusion:** In `packages/core/src/plugin-registry.ts` (lines 20-29):
```typescript
  private readonly builtinPackNames: string[] = [
    '@relay/rules-security',
    '@relay/rules-accessibility',
    '@relay/rules-performance',
    '@relay/rules-testing',
    '@relay/rules-architecture',
    '@relay/rules-deployment',
    '@relay/rules-documentation',
  ];
```
However, `@relay/rules-security` is not listed as a dependency in `packages/core/package.json` or `packages/cli/package.json`.

2. **CLI Option Ignored:** In `packages/cli/src/shared-args.ts`, a `--config` option is defined (lines 46-49):
```typescript
  config: {
    type: 'string' as const,
    description: 'Config file path (default: auto-detect)',
  },
```
But in the conversion function `toRunOptions` (lines 66-76):
```typescript
export function toRunOptions(
  args: SharedReviewArgs,
  categories?: RuleCategory[]
): RunOptions {
  return {
    cwd: args.cwd,
    severity: args.severity as Severity,
    framework: args.framework as RunOptions['framework'],
    categories,
  };
}
```
The `config` argument is completely omitted.

3. **CLI Doctor Command Cwd Discrepancy:** In `packages/cli/src/commands/doctor.ts` (lines 43-46):
```typescript
    const foundConfig = configFiles.find((f) => existsSync(join(cwd, f)));
    if (foundConfig) {
      logger.success(`Config found: ${foundConfig}`);
      const validation = await engine.validate(null);
```
However, in `packages/core/src/engine.ts` (lines 127-137):
```typescript
  async validate(
    config: unknown
  ): Promise<{ valid: true } | { valid: false; errors: string[] }> {
    try {
      await this.configLoader.load(process.cwd(), config as Partial<RelayConfig>);
      return { valid: true };
    }
```

4. **Turbo configuration inputs missing files:** In `turbo.json` (lines 5-9):
```json
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
```

---

## 2. Logic Chain

1. **Broken Test & Typecheck Compilation:**
   - *Observation:* `packages/rules/security/src/rules/hardcoded-secrets.test.ts` references the path `../src/rules/hardcoded-secrets.js`.
   - *Logic:* Since the test file is located at `packages/rules/security/src/rules/hardcoded-secrets.test.ts`, the relative path `../src/rules/` resolves to `packages/rules/security/src/src/rules/`. This directory does not exist.
   - *Conclusion:* Running `vitest` or compiling via TypeScript `tsc --noEmit` will raise a module-not-found error, preventing build/test verification from passing.

2. **Production Installation Missing Rules Pack:**
   - *Observation:* `@relay/rules-security` is declared as a built-in pack name inside `@relay/core`'s registry, but is not declared as a dependency in `@relay/core` or `@relay/cli` `package.json` files.
   - *Logic:* When a user installs `@relay/cli` or `@relay/core` in production from npm, the package manager will not install `@relay/rules-security`. Thus, it will not be found in `node_modules` at runtime, causing the CLI tool to silently run with zero built-in rules.
   - *Conclusion:* `@relay/rules-security` must be added to `@relay/core` dependencies.

3. **Inoperable `--config` CLI Option:**
   - *Observation:* The `--config` parameter is parsed by the CLI but not passed to `toRunOptions` / `RelayEngine.run`. Additionally, `ConfigLoader.load` does not accept a custom config filename parameter to override `c12` detection.
   - *Logic:* Passing a custom configuration path via `--config` has zero effect.
   - *Conclusion:* The `--config` option is non-functional and requires updates in CLI mappings, `RelayEngine.run` signatures, and `ConfigLoader` options.

4. **CLI Doctor Command Scoping Issue:**
   - *Observation:* `doctorCommand` identifies the configuration file path relative to its input `cwd`, but passes validation handling to `engine.validate(null)`, which strictly checks the configuration path relative to `process.cwd()`.
   - *Logic:* Running `relay doctor --cwd <path>` will validate the configuration located in `process.cwd()` instead of `<path>`.
   - *Conclusion:* `engine.validate` should accept a `cwd` parameter to align with CLI arguments.

5. **Stale Turborepo Cache Risk:**
   - *Observation:* Root `tsconfig.base.json` and package-level `tsup.config.ts` files are not listed as inputs in `turbo.json`.
   - *Logic:* Modifying TS compiler configurations or bundling options will not invalidate cached turbo outputs, leading to build mismatches in developers' environments.
   - *Conclusion:* Include configuration/builder files in task inputs.

---

## 3. Caveats
- Checked and analyzed configurations without executing the build/test commands as the shell run commands timed out waiting for approval.
- We assume that the other rule packs listed in `PluginRegistry` (e.g. accessibility, performance) are intended to be omitted at this stage as they are documented as "coming" in the roadmap.

---

## 4. Conclusion
To resolve the configuration errors and restore compiler/test functionality:
1. **Fix broken unit test import:** Update line 2 of `packages/rules/security/src/rules/hardcoded-secrets.test.ts` to:
   ```typescript
   import { hardcodedSecretsRule } from './hardcoded-secrets.js';
   ```
2. **Add security rules dependency:** List `@relay/rules-security` as a workspace dependency inside `packages/core/package.json`.
3. **Map and pass `--config` file:** Pass the custom config path through `RunOptions`, exposing it in `RelayEngine.run` and updating `ConfigLoader` to supply `configFile` to `c12`.
4. **Fix CLI Doctor cwd scope:** Update `RelayEngine.validate` to take a `cwd` argument and apply it inside `doctorCommand`.
5. **Optimize Turbo cache invalidation:** Include `../../tsconfig.base.json` and `tsup.config.ts` in turbo build task inputs.

---

## 5. Verification Method

### 1. Test Suite Verification
Run the vitest test suite for security rules:
```bash
pnpm --filter @relay/rules-security test
```
Verify that the tests compile and all 6 tests inside `hardcoded-secrets.test.ts` pass successfully.

### 2. Monorepo Build and Typecheck
Verify compilation and formatting across the entire monorepo:
```bash
pnpm build
pnpm typecheck
pnpm lint
```
These should all run without warnings or errors.

### 3. Config Path Verification
Create a temporary custom config file at `test.relayrc.json` and run the CLI using:
```bash
pnpm --filter @relay/cli run relay review --config test.relayrc.json
```
Verify that the configuration is read correctly and the scan respects thresholds/rules defined in the file.
