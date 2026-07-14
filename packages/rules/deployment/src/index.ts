import type { RulePack } from '@relay/shared';
import { missingDockerHealthcheckRule, dockerRunAsRootRule } from './rules/docker.js';

const pack: RulePack = {
  name: '@relay/rules-deployment',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/deployment',
  rules: [
    missingDockerHealthcheckRule, // DEPLOY-001
    dockerRunAsRootRule,          // DEPLOY-002
  ],
};

export default pack;
export const rules = pack.rules;
