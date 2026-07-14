## 2026-07-14T09:26:24Z
You are a teamwork_preview_auditor. Your working directory is /Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_auditor_audit_1/.
Your task is to run forensic integrity audit checks on the codebase.
Specifically:
1. Verify that the implementation is genuine and there is no hardcoding of test results, dummy/facade implementations, or expected CLI outputs.
2. Verify that the unit tests actually run and execute real logic, rather than dummy assertions.
3. Verify that the CLI output actually computes the score, status, and findings dynamically based on the rule execution.
4. Perform static analysis and check execution patterns to ensure no cheating exists.
5. Report your final verdict (CLEAN or INTEGRITY VIOLATION) and detailed evidence in `/Volumes/Disk D/prog/Github/QA Audit skill/.agents/teamwork_preview_auditor_audit_1/handoff.md`.
