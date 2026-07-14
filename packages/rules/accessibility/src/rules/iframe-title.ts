import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * A11Y-005: Missing iframe Title
 * WCAG 2.1 Success Criterion 4.1.2 (Name, Role, Value)
 */
export const missingIframeTitleRule: Rule = {
  id: 'A11Y-005',
  name: 'Missing iframe Title',
  category: 'accessibility',
  severity: 'medium',
  description: 'Ensure all <iframe> elements have a non-empty title attribute',
  rationale:
    'Screen readers use the iframe title to let users know what the iframe contains without having to navigate into it.',
  docs: 'https://relay.dev/rules/A11Y-005',
  tags: ['wcag-4.1.2', 'a11y', 'html'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsHtmlLike = new Set(['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte', 'astro']);

    const iframePattern = /<iframe([\s\S]*?)>/gi;

    for (const file of ctx.sourceFiles) {
      if (!jsHtmlLike.has(file.extension)) continue;

      iframePattern.lastIndex = 0;
      while (true) {
        const match = iframePattern.exec(file.content);
        if (match === null) break;
        const tagContent = match[1] ?? '';
        const hasTitle = /\btitle\s*=/i.test(tagContent);

        if (!hasTitle) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-005',
            severity: 'medium',
            category: 'accessibility',
            message: '<iframe> element is missing a title attribute',
            file: file.relativePath,
            line,
            evidence: match[0].trim().replace(/\s+/g, ' '),
            suggestion:
              'Add a descriptive title attribute to the iframe, e.g. title="Embedded Map" or title="Third-party Widget".',
            docs: 'https://relay.dev/rules/A11Y-005',
          });
        }
      }
    }

    return findings;
  },
};
