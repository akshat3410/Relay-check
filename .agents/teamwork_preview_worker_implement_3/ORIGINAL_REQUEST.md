## 2026-07-14T15:11:31+05:30
You are a teamwork_preview_worker. Your working directory is /Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_worker_implement_3/.
Your task is to fix the package exports mapping and verify rules execution:
1. Update `packages/rules/security/package.json`'s `exports` block to include a `"default"` fallback, so that `require.resolve` (used by the dynamic plugin loader in core) can find it. The block should look like:
   ```json
   "exports": {
     ".": {
       "import": "./dist/index.js",
       "types": "./dist/index.d.ts",
       "default": "./dist/index.js"
     }
   }
   ```
2. Run `pnpm build` in the project root to compile the packages with the new exports map.
3. Run the CLI review command: `node packages/cli/dist/cli.js review --format json --cwd .`.
4. Capture the JSON output and verify that `rulesRun` is now `10`.
5. Confirm that the JSON output is valid, parseable, and contains the required fields: `version`, `timestamp`, `framework`, `score`, `status`, `findings`, `summary`.
6. Document all commands, stdout/stderr outputs, and file verification checks in a handoff report at `/Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_worker_implement_3/handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
