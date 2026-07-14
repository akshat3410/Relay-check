import { describe, it, expect } from 'vitest';
import { devDepsInProdRule } from './dev-deps-in-prod.js';
import { unoptimizedImagesRule } from './unoptimized-images.js';
import { largeImportsRule } from './large-imports.js';
import type { ProjectContext, Framework } from '@relay/shared';

function buildCtx(
  files: Array<{ path: string; content: string }>,
  deps: Array<{ name: string; version: string; isDev: boolean }> = [],
  frameworks: Framework[] = ['react']
): ProjectContext {
  return {
    cwd: '/test',
    framework: frameworks[0] ?? 'react',
    allFrameworks: frameworks,
    packageJson: null,
    dependencies: deps.map(d => ({ ...d, isPeer: false })),
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

describe('Performance Rules', () => {
  describe('PERF-001: Dev Dependencies in Production', () => {
    it('flags typescript in dependencies', async () => {
      const ctx = buildCtx([], [{ name: 'typescript', version: '^5.0.0', isDev: false }]);
      const findings = await devDepsInProdRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('PERF-001');
    });

    it('does not flag typescript in devDependencies', async () => {
      const ctx = buildCtx([], [{ name: 'typescript', version: '^5.0.0', isDev: true }]);
      const findings = await devDepsInProdRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });

    it('flags @types packages in dependencies', async () => {
      const ctx = buildCtx([], [{ name: '@types/node', version: '^20.0.0', isDev: false }]);
      const findings = await devDepsInProdRule.execute(ctx);
      expect(findings).toHaveLength(1);
    });
  });

  describe('PERF-002: Unoptimized Images', () => {
    it('flags standard img in Next.js', async () => {
      const ctx = buildCtx([{ path: 'pages/index.tsx', content: '<img src="logo.png" />' }], [], ['nextjs']);
      const findings = await unoptimizedImagesRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('PERF-002');
      expect(findings[0]?.message).toContain('Next.js');
    });

    it('flags missing loading="lazy" in vanilla React', async () => {
      const ctx = buildCtx([{ path: 'src/App.jsx', content: '<img src="banner.png" />' }], [], ['react']);
      const findings = await unoptimizedImagesRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('PERF-002');
      expect(findings[0]?.message).toContain('loading="lazy"');
    });

    it('does not flag img with loading="lazy"', async () => {
      const ctx = buildCtx([{ path: 'src/App.jsx', content: '<img src="banner.png" loading="lazy" />' }], [], ['react']);
      const findings = await unoptimizedImagesRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('PERF-003: Large Imports', () => {
    it('flags monolithic lodash import', async () => {
      const ctx = buildCtx([{ path: 'utils.ts', content: 'import _ from "lodash";' }]);
      const findings = await largeImportsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('PERF-003');
    });

    it('flags moment import', async () => {
      const ctx = buildCtx([{ path: 'date.ts', content: 'import moment from "moment";' }]);
      const findings = await largeImportsRule.execute(ctx);
      expect(findings).toHaveLength(1);
    });

    it('does not flag lodash sub-module import', async () => {
      const ctx = buildCtx([{ path: 'utils.ts', content: 'import map from "lodash/map";' }]);
      const findings = await largeImportsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });
});
