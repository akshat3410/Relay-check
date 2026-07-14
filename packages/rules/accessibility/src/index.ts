import type { RulePack } from '@relay/shared';
import { missingAltTextRule } from './rules/alt-text.js';
import { missingInputLabelsRule } from './rules/input-labels.js';
import { missingHtmlLangRule } from './rules/html-lang.js';
import { emptyInteractiveRule } from './rules/empty-interactive.js';
import { missingIframeTitleRule } from './rules/iframe-title.js';

const pack: RulePack = {
  name: '@relay/rules-accessibility',
  version: '0.1.0',
  docs: 'https://relay.dev/rules/accessibility',
  rules: [
    missingAltTextRule,      // A11Y-001
    missingInputLabelsRule,  // A11Y-002
    missingHtmlLangRule,     // A11Y-003
    emptyInteractiveRule,    // A11Y-004
    missingIframeTitleRule,  // A11Y-005
  ],
};

export default pack;
export const rules = pack.rules;
