import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * PERF-003: Large Imports
 * Detects monolithic imports of lodash or moment which bloat bundles.
 */
export const largeImportsRule: Rule = {
  id: 'PERF-003',
  name: 'Monolithic Large Imports',
  category: 'performance',
  severity: 'medium',
  description: 'Identify monolithic imports of large packages like lodash or moment',
  rationale: 'Importing the entire lodash or moment library pulls in the entire bundle, costing hundreds of kilobytes. Lodash should be imported by individual modules, and moment is deprecated and should be replaced with lighter alternatives like dayjs, luxon, or date-fns.',
  docs: 'https://relay.dev/rules/PERF-003',
  tags: ['performance', 'bundle-size', 'imports'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']);

    // import _ from 'lodash' or import * as _ from 'lodash' or const _ = require('lodash')
    const lodashPattern = /import\s+[^;]*\b(?:_)\b[^;]*\s+from\s+['"]lodash['"]/g;
    const lodashRequirePattern = /(?:const|let|var)\s+\b(?:_)\b\s*=\s*require\s*\(\s*['"]lodash['"]\s*\)/g;

    // import moment from 'moment' or const moment = require('moment')
    const momentPattern = /import\s+[^;]*\b(?:moment)\b[^;]*\s+from\s+['"]moment['"]/g;
    const momentRequirePattern = /(?:const|let|var)\s+\bmoment\b\s*=\s*require\s*\(\s*['"]moment['"]\s*\)/g;

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;

      // Check Lodash
      lodashPattern.lastIndex = 0;
      lodashRequirePattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      if ((match = lodashPattern.exec(file.content)) !== null || (match = lodashRequirePattern.exec(file.content)) !== null) {
        const line = file.content.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'PERF-003',
          severity: 'medium',
          category: 'performance',
          message: 'Monolithic lodash import detected',
          file: file.relativePath,
          line,
          evidence: match[0],
          suggestion: 'Import individual lodash methods to support tree-shaking: e.g. import map from "lodash/map" instead of import _ from "lodash".',
          docs: 'https://relay.dev/rules/PERF-003',
        });
      }

      // Check Moment
      momentPattern.lastIndex = 0;
      momentRequirePattern.lastIndex = 0;

      if ((match = momentPattern.exec(file.content)) !== null || (match = momentRequirePattern.exec(file.content)) !== null) {
        const line = file.content.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'PERF-003',
          severity: 'medium',
          category: 'performance',
          message: 'Moment.js import detected',
          file: file.relativePath,
          line,
          evidence: match[0],
          suggestion: 'Moment.js is legacy and non-tree-shakable. Migrate to modern, lighter alternatives like dayjs, date-fns, or native Intl API.',
          docs: 'https://relay.dev/rules/PERF-003',
        });
      }
    }

    return findings;
  },
};
