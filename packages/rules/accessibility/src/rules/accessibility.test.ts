import { describe, it, expect } from 'vitest';
import { missingAltTextRule } from './alt-text.js';
import { missingInputLabelsRule } from './input-labels.js';
import { missingHtmlLangRule } from './html-lang.js';
import { emptyInteractiveRule } from './empty-interactive.js';
import { missingIframeTitleRule } from './iframe-title.js';
import type { ProjectContext } from '@relay/shared';

function buildCtx(files: Array<{ path: string; content: string }>): ProjectContext {
  return {
    cwd: '/test',
    framework: 'react',
    allFrameworks: ['react'],
    packageJson: null,
    dependencies: [],
    sourceFiles: files.map((f) => ({
      path: `/test/${f.path}`,
      relativePath: f.path,
      extension: f.path.split('.').pop() ?? '',
      content: f.content,
      lines: f.content.split('\n'),
      sizeBytes: Buffer.byteLength(f.content),
    })),
    configFiles: [],
    git: null,
    hasLockfile: true,
    packageManager: 'pnpm',
    scannedAt: new Date().toISOString(),
    relayVersion: '0.0.0-test',
    meta: {},
  };
}

describe('Accessibility Rules', () => {
  describe('A11Y-001: Missing Image Alt Text', () => {
    it('flags image missing alt attribute', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<img src="logo.png" />' }]);
      const findings = await missingAltTextRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('A11Y-001');
    });

    it('does not flag image with alt attribute', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<img src="logo.png" alt="Company Logo" />' }]);
      const findings = await missingAltTextRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('does not flag decorative image with empty alt attribute', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<img src="divider.png" alt="" />' }]);
      const findings = await missingAltTextRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('A11Y-002: Missing Form Labels', () => {
    it('flags input missing label', async () => {
      const ctx = buildCtx([{ path: 'Form.tsx', content: '<input type="text" id="username" />' }]);
      const findings = await missingInputLabelsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('A11Y-002');
    });

    it('does not flag input with matching label', async () => {
      const ctx = buildCtx([{
        path: 'Form.tsx',
        content: `
          <label htmlFor="username">Username</label>
          <input type="text" id="username" />
        `,
      }]);
      const findings = await missingInputLabelsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('does not flag input with aria-label', async () => {
      const ctx = buildCtx([{ path: 'Form.tsx', content: '<input type="text" aria-label="Search" />' }]);
      const findings = await missingInputLabelsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('ignores input of type submit', async () => {
      const ctx = buildCtx([{ path: 'Form.tsx', content: '<input type="submit" value="Send" />' }]);
      const findings = await missingInputLabelsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('A11Y-003: Missing HTML lang Attribute', () => {
    it('flags html tag missing lang in html files', async () => {
      const ctx = buildCtx([{ path: 'index.html', content: '<html><head></head><body></body></html>' }]);
      const findings = await missingHtmlLangRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('A11Y-003');
    });

    it('does not flag html tag with lang', async () => {
      const ctx = buildCtx([{ path: 'index.html', content: '<html lang="en"></html>' }]);
      const findings = await missingHtmlLangRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('A11Y-004: Empty Buttons or Links', () => {
    it('flags empty button without label', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<button></button>' }]);
      const findings = await emptyInteractiveRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('A11Y-004');
    });

    it('does not flag button with text content', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<button>Save</button>' }]);
      const findings = await emptyInteractiveRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('does not flag button with aria-label', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<button aria-label="Close menu" />' }]);
      const findings = await emptyInteractiveRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('flags empty links', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<a href="/dashboard"></a>' }]);
      const findings = await emptyInteractiveRule.execute(ctx);
      expect(findings).toHaveLength(1);
    });

    it('does not flag links with text or children', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<a href="/">Go Home</a>' }]);
      const findings = await emptyInteractiveRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('A11Y-005: Missing iframe Title', () => {
    it('flags iframe missing title attribute', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<iframe src="https://example.com"></iframe>' }]);
      const findings = await missingIframeTitleRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('A11Y-005');
    });

    it('does not flag iframe with title attribute', async () => {
      const ctx = buildCtx([{ path: 'App.tsx', content: '<iframe src="https://example.com" title="Example map"></iframe>' }]);
      const findings = await missingIframeTitleRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });
});
