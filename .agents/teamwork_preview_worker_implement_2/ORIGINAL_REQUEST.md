## 2026-07-14T09:18:29Z
You are a teamwork_preview_worker. Your working directory is /Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_worker_implement_2/.
Your task is to run the build, test, and CLI commands and verify the monorepo functionality:
1. Run `pnpm install` in the workspace root `/Volumes/Disk D/prog/Github/QA Audit skill` to link package dependencies and update the lockfile.
2. Run `pnpm build` to compile all workspace packages and ensure they produce `dist/` directories without errors.
3. Run `pnpm test` to verify that all unit tests (specifically SEC-001 hardcoded-secrets unit tests in `packages/rules/security/src/rules/hardcoded-secrets.test.ts`) compile and pass. No tests may be skipped.
4. Verify that the CLI boots and works correctly:
   - Run `node packages/cli/dist/cli.js version` and capture the version output.
   - Run `node packages/cli/dist/cli.js review --format json --cwd .` and capture the JSON output.
5. Verify that the JSON output is valid and contains the required fields: `version`, `timestamp`, `framework`, `score`, `status`, `findings`, `summary`.
6. Document all commands, stdout/stderr outputs, and file verification checks in a handoff report at `/Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_worker_implement_2/handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
