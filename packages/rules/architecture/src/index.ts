import type { RulePack } from '@relay/shared';
import { deepImportsRule } from './rules/deep-imports.js';
import { godFilesRule } from './rules/god-files.js';
import { deprecatedDepsRule } from './rules/deprecated-deps.js';

const pack: RulePack = {
  name: '@relay/rules-architecture',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/architecture',
  rules: [
    deepImportsRule,        // ARCH-001
    godFilesRule,           // ARCH-002
    deprecatedDepsRule,     // ARCH-003
  ],
};

export default pack;
export const rules = pack.rules;
