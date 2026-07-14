import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * A11Y-003: Missing HTML lang Attribute
 * WCAG 2.1 Success Criterion 3.1.1 (Language of Page)
 */
export const missingHtmlLangRule: Rule = {
  id: 'A11Y-003',
  name: 'Missing HTML lang Attribute',
  category: 'accessibility',
  severity: 'high',
  description: 'Ensure the <html> element has a valid lang attribute',
  rationale: 'Screen readers use the lang attribute to load the correct pronunciation rules and voice profiles. Without it, screen readers default to the user\'s default language, which may result in incorrect speech output.',
  docs: 'https://relay.dev/rules/A11Y-003',
  tags: ['wcag-3.1.1', 'a11y', 'html'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    for (const file of ctx.sourceFiles) {
      if (file.extension !== 'html' && file.extension !== 'htm') continue;
      // Skip templates or examples if not production-critical
      if (file.relativePath.includes('node_modules')) continue;

      const htmlTagPattern = /<html([\s\S]*?)>/gi;
      let match: RegExpExecArray | null;

      while ((match = htmlTagPattern.exec(file.content)) !== null) {
        const tagContent = match[1] ?? '';
        const hasLang = /\blang\s*=/i.test(tagContent);

        if (!hasLang) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-003',
            severity: 'high',
            category: 'accessibility',
            message: '<html> element is missing a lang attribute',
            file: file.relativePath,
            line,
            evidence: match[0].trim().replace(/\s+/g, ' '),
            suggestion: 'Add a lang attribute to the <html> element, e.g., <html lang="en">.',
            docs: 'https://relay.dev/rules/A11Y-003',
          });
        }
      }
    }

    return findings;
  },
};
