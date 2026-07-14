import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * A11Y-004: Empty Button/Link Content
 * WCAG 2.1 Success Criterion 2.4.4 (Link Purpose) / 4.1.2 (Name, Role, Value)
 */
export const emptyInteractiveRule: Rule = {
  id: 'A11Y-004',
  name: 'Empty Buttons or Links',
  category: 'accessibility',
  severity: 'high',
  description: 'Ensure buttons and links have visible text content or an aria-label attribute',
  rationale:
    'Interactive elements like buttons and links must have a name to be announced by screen readers. Empty buttons or links offer no context to users navigating with assistive technologies.',
  docs: 'https://relay.dev/rules/A11Y-004',
  tags: ['wcag-2.4.4', 'wcag-4.1.2', 'a11y', 'html'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsHtmlLike = new Set(['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte', 'astro']);

    // Match <button...>...</button> or <button .../>
    const buttonPattern = /<button([\s\S]*?)>([\s\S]*?)<\/button>|<button([\s\S]*?)\/>/gi;
    // Match <a...>...</a>
    const linkPattern = /<a([\s\S]*?)>([\s\S]*?)<\/a>/gi;

    for (const file of ctx.sourceFiles) {
      if (!jsHtmlLike.has(file.extension)) continue;

      // 1. Check buttons
      buttonPattern.lastIndex = 0;
      while (true) {
        const btnMatch = buttonPattern.exec(file.content);
        if (btnMatch === null) break;
        const fullMatch = btnMatch[0] ?? '';
        const tagAttribs = btnMatch[1] ?? btnMatch[3] ?? '';
        const content = btnMatch[2] ?? '';

        const hasAriaLabel =
          /\baria-label\s*=/i.test(tagAttribs) || /:\baria-label\s*=/i.test(tagAttribs);
        const hasAriaLabelledBy =
          /\baria-labelledby\s*=/i.test(tagAttribs) || /:\baria-labelledby\s*=/i.test(tagAttribs);
        const hasContent = content.trim().length > 0;

        if (!hasContent && !hasAriaLabel && !hasAriaLabelledBy) {
          const line = file.content.slice(0, btnMatch.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-004',
            severity: 'high',
            category: 'accessibility',
            message: 'Button element is empty and lacks an aria-label',
            file: file.relativePath,
            line,
            evidence: fullMatch.trim().replace(/\s+/g, ' '),
            suggestion:
              'Add visible text content inside the button, or add an aria-label attribute.',
            docs: 'https://relay.dev/rules/A11Y-004',
          });
        }
      }

      // 2. Check links
      linkPattern.lastIndex = 0;
      while (true) {
        const lnkMatch = linkPattern.exec(file.content);
        if (lnkMatch === null) break;
        const fullMatch = lnkMatch[0] ?? '';
        const tagAttribs = lnkMatch[1] ?? '';
        const content = lnkMatch[2] ?? '';

        const hasAriaLabel =
          /\baria-label\s*=/i.test(tagAttribs) || /:\baria-label\s*=/i.test(tagAttribs);
        const hasAriaLabelledBy =
          /\baria-labelledby\s*=/i.test(tagAttribs) || /:\baria-labelledby\s*=/i.test(tagAttribs);
        // Links might have children like images with alt, or icons
        const hasChildTag = /<[^>]+>/i.test(content);
        const hasContent = content.trim().length > 0;

        if (!hasContent && !hasChildTag && !hasAriaLabel && !hasAriaLabelledBy) {
          const line = file.content.slice(0, lnkMatch.index).split('\n').length;
          findings.push({
            ruleId: 'A11Y-004',
            severity: 'high',
            category: 'accessibility',
            message: 'Anchor link is empty and lacks an aria-label',
            file: file.relativePath,
            line,
            evidence: fullMatch.trim().replace(/\s+/g, ' '),
            suggestion: 'Add text inside the anchor element, or add an aria-label attribute.',
            docs: 'https://relay.dev/rules/A11Y-004',
          });
        }
      }
    }

    return findings;
  },
};
