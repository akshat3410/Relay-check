import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * A11Y-001: Missing Alt Text
 * WCAG 2.1 Success Criterion 1.1.1 (Non-text Content)
 */
export const missingAltTextRule: Rule = {
  id: 'A11Y-001',
  name: 'Missing Image Alt Text',
  category: 'accessibility',
  severity: 'high',
  description: 'Ensure all <img> elements have an alt attribute for screen readers',
  rationale:
    'Screen readers read the alt attribute to describe images to visually impaired users. Missing alt attributes cause screen readers to announce the file path or ignore the image entirely.',
  docs: 'https://relay.dev/rules/A11Y-001',
  tags: ['wcag-1.1.1', 'a11y', 'html'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsHtmlLike = new Set(['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte', 'astro']);

    // Match <img ...> tags (including multiline matches)
    const imgPattern = /<img([\s\S]*?)>/gi;

    for (const file of ctx.sourceFiles) {
      if (!jsHtmlLike.has(file.extension)) continue;

      imgPattern.lastIndex = 0;
      while (true) {
        const match = imgPattern.exec(file.content);
        if (match === null) break;
        const tagContent = match[1] ?? '';

        // Check if "alt=" is present in the tag content
        // In JSX/Vue, we might see: alt="val", alt='val', alt={val}, v-bind:alt, :alt
        const hasAlt = /\balt\s*=/i.test(tagContent) || /:\balt\s*=/i.test(tagContent);

        if (!hasAlt) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-001',
            severity: 'high',
            category: 'accessibility',
            message: '<img> element is missing an alt attribute',
            file: file.relativePath,
            line,
            evidence: match[0].trim().replace(/\s+/g, ' '),
            suggestion:
              'Add an alt attribute describing the image (e.g. alt="Company Logo"), or alt="" if the image is purely decorative.',
            docs: 'https://relay.dev/rules/A11Y-001',
          });
        }
      }
    }

    return findings;
  },
};
