import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * PERF-002: Unoptimized Images
 * Detects <img> elements in React/Next.js files or missing lazy-loading.
 */
export const unoptimizedImagesRule: Rule = {
  id: 'PERF-002',
  name: 'Unoptimized Images',
  category: 'performance',
  severity: 'medium',
  description: 'Identify unoptimized images or missing image lazy loading',
  rationale: 'Images are typically the largest assets on a web page. In Next.js, using standard <img> instead of next/image bypasses automated resizing, optimization, and modern format delivery. In static sites, missing loading="lazy" causes browsers to download off-screen images prematurely.',
  docs: 'https://relay.dev/rules/PERF-002',
  tags: ['performance', 'lcp', 'images'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const jsHtmlLike = new Set(['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte', 'astro']);

    const isNext = ctx.allFrameworks.includes('nextjs');
    const imgPattern = /<img([\s\S]*?)>/gi;

    for (const file of ctx.sourceFiles) {
      if (!jsHtmlLike.has(file.extension)) continue;

      imgPattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = imgPattern.exec(file.content)) !== null) {
        const tagContent = match[1] ?? '';
        const line = file.content.slice(0, match.index).split('\n').length;

        if (isNext && ['jsx', 'tsx'].includes(file.extension)) {
          findings.push({
            ruleId: 'PERF-002',
            severity: 'medium',
            category: 'performance',
            message: 'Using standard <img> instead of Next.js <Image /> component',
            file: file.relativePath,
            line,
            evidence: match[0].trim().replace(/\s+/g, ' '),
            suggestion: 'Import and use the Image component from "next/image" to auto-optimize sizes and formats.',
            docs: 'https://relay.dev/rules/PERF-002',
          });
        } else {
          // Check for loading="lazy" or fetchpriority="high" (LCP image might not need lazy loading)
          const hasLazy = /\bloading\s*=\s*["']lazy["']/i.test(tagContent);
          const hasHighPriority = /\bfetchpriority\s*=\s*["']high["']/i.test(tagContent);

          if (!hasLazy && !hasHighPriority) {
            findings.push({
              ruleId: 'PERF-002',
              severity: 'low',
              category: 'performance',
              message: '<img> element missing loading="lazy" or fetchpriority attribute',
              file: file.relativePath,
              line,
              evidence: match[0].trim().replace(/\s+/g, ' '),
              suggestion: 'Add loading="lazy" for below-the-fold images, or fetchpriority="high" for the Largest Contentful Paint (LCP) hero image.',
              docs: 'https://relay.dev/rules/PERF-002',
            });
          }
        }
      }
    }

    return findings;
  },
};
