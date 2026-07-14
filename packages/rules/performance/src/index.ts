import type { RulePack } from '@relay/shared';
import { devDepsInProdRule } from './rules/dev-deps-in-prod.js';
import { unoptimizedImagesRule } from './rules/unoptimized-images.js';
import { largeImportsRule } from './rules/large-imports.js';

const pack: RulePack = {
  name: '@relay/rules-performance',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/performance',
  rules: [
    devDepsInProdRule,      // PERF-001
    unoptimizedImagesRule,  // PERF-002
    largeImportsRule,       // PERF-003
  ],
};

export default pack;
export const rules = pack.rules;
