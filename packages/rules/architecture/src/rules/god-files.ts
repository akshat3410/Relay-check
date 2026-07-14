import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * ARCH-002: God Files
 * Detects files with excessive line counts (e.g. >1000 lines).
 */
export const godFilesRule: Rule = {
  id: 'ARCH-002',
  name: 'God Files (Large Modules)',
  category: 'architecture',
  severity: 'medium',
  description:
    'Identify exceptionally large files that may violate the Single Responsibility Principle',
  rationale:
    'Files with more than 1000 lines are harder to maintain, understand, and test. They often act as "God objects" containing unrelated logic that should be split into smaller, cohesive modules.',
  docs: 'https://relay.dev/rules/ARCH-002',
  tags: ['architecture', 'complexity', 'maintainability'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsLike = new Set([
      'ts',
      'tsx',
      'js',
      'jsx',
      'mjs',
      'py',
      'go',
      'php',
      'rb',
      'java',
      'cs',
    ]);

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;
      // Skip lockfiles, third-party libraries, or auto-generated code
      if (
        file.relativePath.includes('node_modules') ||
        file.relativePath.includes('dist') ||
        file.relativePath.includes('build') ||
        file.relativePath.includes('generated') ||
        file.relativePath.includes('schema')
      ) {
        continue;
      }

      if (file.lines.length > 1000) {
        findings.push({
          ruleId: 'ARCH-002',
          severity: 'medium',
          category: 'architecture',
          message: `Large module file detected: ${file.lines.length} lines of code`,
          file: file.relativePath,
          evidence: `Line count: ${file.lines.length}`,
          suggestion:
            'Refactor this module by breaking it down into smaller, focused files or helper modules.',
          docs: 'https://relay.dev/rules/ARCH-002',
        });
      }
    }

    return findings;
  },
};
