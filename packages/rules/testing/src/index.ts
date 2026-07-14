import type { RulePack } from '@relay/shared';
import { emptyTestsRule } from './rules/empty-tests.js';
import { noTestsRule } from './rules/no-tests.js';
import { skippedFocusedTestsRule } from './rules/skipped-focused-tests.js';

const pack: RulePack = {
  name: '@relay/rules-testing',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/testing',
  rules: [
    emptyTestsRule, // TEST-001
    noTestsRule, // TEST-002
    skippedFocusedTestsRule, // TEST-003
  ],
};

export default pack;
export const rules = pack.rules;
