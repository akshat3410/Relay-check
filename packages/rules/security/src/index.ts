import type { RulePack } from '@relay/shared';
import { hardcodedSecretsRule } from './rules/hardcoded-secrets.js';
import {
  consoleLogSecretsRule,
  csrfProtectionRule,
  evalUsageRule,
  exposedEnvRule,
  httpsEnforcementRule,
  prototypePollutionRule,
  securityHeadersRule,
  sqlInjectionRule,
  vulnerableDepsRule,
} from './rules/sec-002-010.js';

const pack: RulePack = {
  name: '@relay/rules-security',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/security',
  rules: [
    hardcodedSecretsRule, // SEC-001 critical
    httpsEnforcementRule, // SEC-002 high
    vulnerableDepsRule, // SEC-003 high
    exposedEnvRule, // SEC-004 critical
    evalUsageRule, // SEC-005 critical
    sqlInjectionRule, // SEC-006 critical
    csrfProtectionRule, // SEC-007 high
    consoleLogSecretsRule, // SEC-008 high
    securityHeadersRule, // SEC-009 medium
    prototypePollutionRule, // SEC-010 high
  ],
};

export default pack;
export const rules = pack.rules;
