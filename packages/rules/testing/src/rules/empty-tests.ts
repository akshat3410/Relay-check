import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * TEST-001: Empty Test Files
 * Detects test files that are either empty or contain no actual test declarations.
 */
export const emptyTestsRule: Rule = {
  id: 'TEST-001',
  name: 'Empty or Mock Test Files',
  category: 'testing',
  severity: 'medium',
  description: 'Identify test files that contain no actual test suites or assertions',
  rationale:
    'Empty or skeleton test files artificially inflate test file counts and pass silently in CI, creating a false sense of security and test coverage.',
  docs: 'https://relay.dev/rules/TEST-001',
  tags: ['testing', 'test-quality'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const testPattern = /\.(test|spec)\.[jt]sx?$/i;

    for (const file of ctx.sourceFiles) {
      if (!testPattern.test(file.relativePath)) continue;

      const trimmedContent = file.content.trim();
      const hasTests = /\b(it|test|describe|suite)\s*\(/i.test(trimmedContent);

      if (trimmedContent.length === 0) {
        findings.push({
          ruleId: 'TEST-001',
          severity: 'high',
          category: 'testing',
          message: `Test file "${file.relativePath}" is completely empty`,
          file: file.relativePath,
          suggestion: 'Implement test cases or delete the empty test file.',
          docs: 'https://relay.dev/rules/TEST-001',
        });
      } else if (!hasTests) {
        findings.push({
          ruleId: 'TEST-001',
          severity: 'medium',
          category: 'testing',
          message: `Test file "${file.relativePath}" contains no test cases (missing describe, test, or it blocks)`,
          file: file.relativePath,
          suggestion: 'Add tests using describe(), test(), or it() blocks, or delete the file.',
          docs: 'https://relay.dev/rules/TEST-001',
        });
      }
    }

    return findings;
  },
};
