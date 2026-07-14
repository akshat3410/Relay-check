import type { RulePack } from '@relay/shared';
import { missingLicenseRule, missingReadmeRule } from './rules/hygiene.js';

const pack: RulePack = {
  name: '@relay/rules-documentation',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/documentation',
  rules: [
    missingReadmeRule, // DOC-001
    missingLicenseRule, // DOC-002
  ],
};

export default pack;
export const rules = pack.rules;
