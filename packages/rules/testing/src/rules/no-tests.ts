import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * TEST-002: Missing Test Suites Entirely
 * Detects projects with no test framework dependencies or zero test files.
 */
export const noTestsRule: Rule = {
  id: 'TEST-002',
  name: 'No Test Suite Configured',
  category: 'testing',
  severity: 'high',
  description: 'Detect projects with zero test coverage or missing test frameworks',
  rationale:
    'Shipping software without automated testing increases the risk of regressions, deployment failures, and production bugs.',
  docs: 'https://relay.dev/rules/TEST-002',
  tags: ['testing', 'reliability'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const testPattern = /\.(test|spec)\.[jt]sx?$/i;

    const hasTestFiles = ctx.sourceFiles.some((f) => testPattern.test(f.relativePath));

    const testFrameworks = new Set([
      'jest',
      'vitest',
      'mocha',
      'jasmine',
      'cypress',
      'playwright',
      '@playwright/test',
      'ava',
      'tape',
    ]);

    const hasTestDeps = ctx.dependencies.some((d) => testFrameworks.has(d.name));

    if (!hasTestFiles && !hasTestDeps) {
      findings.push({
        ruleId: 'TEST-002',
        severity: 'high',
        category: 'testing',
        message: 'No test files or testing framework dependencies detected in the project',
        suggestion:
          'Install a test runner like Vitest (pnpm add -D vitest) or Jest, and write unit/integration tests for core business logic.',
        docs: 'https://relay.dev/rules/TEST-002',
      });
    } else if (hasTestDeps && !hasTestFiles) {
      findings.push({
        ruleId: 'TEST-002',
        severity: 'medium',
        category: 'testing',
        message:
          'Testing frameworks are installed but no test files (*.test.ts, *.spec.ts) were found',
        suggestion: 'Create unit/integration test files to verify application behavior.',
        docs: 'https://relay.dev/rules/TEST-002',
      });
    }

    return findings;
  },
};
