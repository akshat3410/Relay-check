import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * ARCH-003: Deprecated Dependencies
 * Detects legacy, unmaintained, or deprecated packages in dependencies.
 */
export const deprecatedDepsRule: Rule = {
  id: 'ARCH-003',
  name: 'Deprecated or Legacy Dependencies',
  category: 'architecture',
  severity: 'high',
  description: 'Identify deprecated, insecure, or unmaintained package dependencies',
  rationale:
    'Using deprecated libraries (such as tslint or request) exposes projects to security issues, limits future runtime upgrades, and degrades maintainability as community support ceases.',
  docs: 'https://relay.dev/rules/ARCH-003',
  tags: ['architecture', 'dependencies', 'security'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    const deprecatedMap = new Map<string, { replacement: string; severity: 'high' | 'medium' }>([
      ['tslint', { replacement: 'ESLint / Biome', severity: 'high' }],
      ['request', { replacement: 'axios / node-fetch / global fetch', severity: 'high' }],
      ['request-promise', { replacement: 'axios / node-fetch / global fetch', severity: 'high' }],
      ['moment', { replacement: 'dayjs / date-fns / Intl API', severity: 'medium' }],
      ['gulp', { replacement: 'vite / tsup / modern bundlers', severity: 'medium' }],
      ['bower', { replacement: 'npm / pnpm / yarn', severity: 'high' }],
      ['q', { replacement: 'Native Promises (async/await)', severity: 'high' }],
    ]);

    for (const dep of ctx.dependencies) {
      const match = deprecatedMap.get(dep.name);
      if (match) {
        findings.push({
          ruleId: 'ARCH-003',
          severity: match.severity,
          category: 'architecture',
          message: `Legacy/Deprecated dependency "${dep.name}" is used`,
          file: 'package.json',
          evidence: `"${dep.name}": "${dep.version}"`,
          suggestion: `Replace "${dep.name}" with ${match.replacement}.`,
          docs: 'https://relay.dev/rules/ARCH-003',
        });
      }
    }

    return findings;
  },
};
