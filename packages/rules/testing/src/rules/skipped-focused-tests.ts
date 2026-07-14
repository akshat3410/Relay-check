import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * TEST-003: Focused or Skipped Tests
 * Detects .only and .skip usage in test files which may be committed accidentally.
 */
export const skippedFocusedTestsRule: Rule = {
  id: 'TEST-003',
  name: 'Focused or Skipped Tests',
  category: 'testing',
  severity: 'high',
  description: 'Detect focused (.only) or skipped (.skip) tests in test files',
  rationale:
    'Using .only runs only that specific test/describe block, bypassing the rest of the test suite and hiding regressions. Using .skip bypasses test verification for features, risking silent regressions.',
  docs: 'https://relay.dev/rules/TEST-003',
  tags: ['testing', 'test-quality'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const testPattern = /\.(test|spec)\.[jt]sx?$/i;

    const focusedPatterns = [
      /\b(?:it|test|describe|suite)\.only\s*\(/g,
      /\b(?:fit|fdescribe)\s*\(/g,
    ];

    const skippedPatterns = [
      /\b(?:it|test|describe|suite)\.skip\s*\(/g,
      /\b(?:xit|xdescribe)\s*\(/g,
    ];

    for (const file of ctx.sourceFiles) {
      if (!testPattern.test(file.relativePath)) continue;

      // Check for focused tests (.only) - Critical/High because they disable the rest of the suite
      for (const pattern of focusedPatterns) {
        pattern.lastIndex = 0;
        while (true) {
          const match = pattern.exec(file.content);
          if (match === null) break;
          const line = file.content.slice(0, match.index).split('\n').length;
          const lineContent = file.lines[line - 1] ?? '';

          // Skip comments
          if (/^\s*[/#*]/.test(lineContent)) continue;

          findings.push({
            ruleId: 'TEST-003',
            severity: 'high',
            category: 'testing',
            message: `Focused test detected: "${match[0].trim()}" prevents other tests in this file/suite from running`,
            file: file.relativePath,
            line,
            evidence: match[0],
            suggestion:
              'Remove .only / fit / fdescribe before committing to ensure the entire test suite runs.',
            docs: 'https://relay.dev/rules/TEST-003',
          });
        }
      }

      // Check for skipped tests (.skip) - Medium/Low
      for (const pattern of skippedPatterns) {
        pattern.lastIndex = 0;
        while (true) {
          const match = pattern.exec(file.content);
          if (match === null) break;
          const line = file.content.slice(0, match.index).split('\n').length;
          const lineContent = file.lines[line - 1] ?? '';

          // Skip comments
          if (/^\s*[/#*]/.test(lineContent)) continue;

          findings.push({
            ruleId: 'TEST-003',
            severity: 'medium',
            category: 'testing',
            message: `Skipped test detected: "${match[0].trim()}" bypasses verification`,
            file: file.relativePath,
            line,
            evidence: match[0],
            suggestion:
              'Fix the failing test and re-enable it, or delete the test if it is no longer relevant.',
            docs: 'https://relay.dev/rules/TEST-003',
          });
        }
      }
    }

    return findings;
  },
};
