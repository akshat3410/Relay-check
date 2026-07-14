import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * PERF-001: Dev Dependencies in Production Dependencies
 * Detects common development packages listed in 'dependencies' instead of 'devDependencies'.
 */
export const devDepsInProdRule: Rule = {
  id: 'PERF-001',
  name: 'Dev Dependencies in Production',
  category: 'performance',
  severity: 'medium',
  description: 'Ensure development-only packages are not included in production dependencies',
  rationale:
    'Including compiler, test, or lint packages in production dependencies bloats the production node_modules, increases serverless cold start times, and slows down production builds/deployments.',
  docs: 'https://relay.dev/rules/PERF-001',
  tags: ['dependencies', 'bundle-size', 'perf'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    const commonDevPkgs = new Set([
      'typescript',
      'tsup',
      'vitest',
      'jest',
      'eslint',
      'prettier',
      'rollup',
      'webpack',
      'vite',
      'ts-node',
      'tsx',
      'nodemon',
      'rimraf',
      'concurrently',
      'cross-env',
    ]);

    for (const dep of ctx.dependencies) {
      if (dep.isDev) continue;

      const isDevPkg = commonDevPkgs.has(dep.name) || dep.name.startsWith('@types/');

      if (isDevPkg) {
        findings.push({
          ruleId: 'PERF-001',
          severity: 'medium',
          category: 'performance',
          message: `Dev dependency "${dep.name}" is listed in production dependencies`,
          file: 'package.json',
          evidence: `"${dep.name}": "${dep.version}"`,
          suggestion: `Move "${dep.name}" to devDependencies.`,
          docs: 'https://relay.dev/rules/PERF-001',
        });
      }
    }

    return findings;
  },
};
