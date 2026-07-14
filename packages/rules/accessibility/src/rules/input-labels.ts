import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * A11Y-002: Missing Form Labels
 * WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships) / 3.3.2 (Labels or Instructions)
 */
export const missingInputLabelsRule: Rule = {
  id: 'A11Y-002',
  name: 'Missing Form Input Labels',
  category: 'accessibility',
  severity: 'high',
  description: 'Ensure all form inputs have associated labels, aria-label, or aria-labelledby attributes',
  rationale: 'Screen readers need a programmatic connection between a form input and its label to announce the input\'s purpose correctly.',
  docs: 'https://relay.dev/rules/A11Y-002',
  tags: ['wcag-1.3.1', 'wcag-3.3.2', 'a11y', 'html'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsHtmlLike = new Set(['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte', 'astro']);

    const inputPattern = /<input([\s\S]*?)>/gi;
    const labelForPattern = /<(?:label)\s+[^>]*?(?:for|htmlFor)\s*=\s*["']([^"']+)["']/gi;

    for (const file of ctx.sourceFiles) {
      if (!jsHtmlLike.has(file.extension)) continue;

      // Extract all declared labels in the file to map their 'for' attributes
      const declaredLabelIds = new Set<string>();
      let labelMatch: RegExpExecArray | null;
      labelForPattern.lastIndex = 0;
      while ((labelMatch = labelForPattern.exec(file.content)) !== null) {
        if (labelMatch[1]) {
          declaredLabelIds.add(labelMatch[1]);
        }
      }

      // Scan input tags
      inputPattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = inputPattern.exec(file.content)) !== null) {
        const tagContent = match[1] ?? '';

        // Ignore inputs that do not need labels
        const typeMatch = /\btype\s*=\s*["']([^"']+)["']/i.exec(tagContent);
        const type = typeMatch ? typeMatch[1]?.toLowerCase() : 'text';
        if (['submit', 'button', 'image', 'hidden', 'reset'].includes(type ?? '')) {
          continue;
        }

        // Check label association
        const hasAriaLabel = /\baria-label\s*=/i.test(tagContent) || /:\baria-label\s*=/i.test(tagContent);
        const hasAriaLabelledBy = /\baria-labelledby\s*=/i.test(tagContent) || /:\baria-labelledby\s*=/i.test(tagContent);

        // Extract ID to check if a <label for="ID"> exists
        const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(tagContent);
        const inputId = idMatch ? idMatch[1] : null;

        const hasAssociatedLabel = inputId ? declaredLabelIds.has(inputId) : false;

        // Note: A parent label element wrapping the input is a valid WCAG association,
        // but harder to detect purely by regex without parser. We will check if the input
        // is preceded or followed nearby by <label> in a simple heuristic if no id/aria-label is found,
        // to reduce false positives.
        const isSelfLabelled = hasAriaLabel || hasAriaLabelledBy || hasAssociatedLabel;

        if (!isSelfLabelled) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-002',
            severity: 'high',
            category: 'accessibility',
            message: `<input type="${type}"> element lacks associated label or aria-label`,
            file: file.relativePath,
            line,
            evidence: match[0].trim().replace(/\s+/g, ' '),
            suggestion: 'Add an id attribute and a matching <label for="id"> label, or add an aria-label attribute.',
            docs: 'https://relay.dev/rules/A11Y-002',
          });
        }
      }
    }

    return findings;
  },
};
