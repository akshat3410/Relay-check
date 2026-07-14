import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * ARCH-001: Deep Relative Imports
 * Detects overly deep relative path imports (4+ levels up).
 */
export const deepImportsRule: Rule = {
  id: 'ARCH-001',
  name: 'Deep Relative Imports',
  category: 'architecture',
  severity: 'low',
  description: 'Detect excessively deep relative imports that suggest high coupling or poor module structure',
  rationale: 'Deep relative imports (e.g. "../../../../util") create tight coupling between directories. They break easily during refactoring and suggest that the module boundary or project structure is not organized optimally. Using import aliases (like "@/components") is preferred.',
  docs: 'https://relay.dev/rules/ARCH-001',
  tags: ['architecture', 'maintainability'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs']);

    const deepRelativePattern = /from\s+['"](\.\.\/\.\.\/\.\.\/\.\.[^'"]*)['"]/g;

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;

      deepRelativePattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = deepRelativePattern.exec(file.content)) !== null) {
        const line = file.content.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'ARCH-001',
          severity: 'low',
          category: 'architecture',
          message: `Deep relative import path detected: "${match[1]}"`,
          file: file.relativePath,
          line,
          evidence: match[0],
          suggestion: 'Configure and use path aliases (e.g. "@/*" in tsconfig.json) to refer to root-level modules cleanly.',
          docs: 'https://relay.dev/rules/ARCH-001',
        });
      }
    }

    return findings;
  },
};
