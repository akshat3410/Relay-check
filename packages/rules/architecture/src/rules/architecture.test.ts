import type { ProjectContext } from '@relay/shared';
import { describe, expect, it } from 'vitest';
import { deepImportsRule } from './deep-imports.js';
import { deprecatedDepsRule } from './deprecated-deps.js';
import { godFilesRule } from './god-files.js';

function buildCtx(
  files: Array<{ path: string; content: string }>,
  deps: Array<{ name: string; version: string; isDev: boolean }> = []
): ProjectContext {
  return {
    cwd: '/test',
    framework: 'react',
    allFrameworks: ['react'],
    packageJson: null,
    dependencies: deps.map((d) => ({ ...d, isPeer: false })),
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

describe('Architecture Rules', () => {
  describe('ARCH-001: Deep Relative Imports', () => {
    it('flags imports that go 4+ levels up', async () => {
      const ctx = buildCtx([
        { path: 'src/features/a/b/c/Component.tsx', content: 'import x from "../../../../utils";' },
      ]);
      const findings = await deepImportsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('ARCH-001');
    });

    it('does not flag standard imports', async () => {
      const ctx = buildCtx([
        { path: 'src/features/a/Component.tsx', content: 'import x from "../utils";' },
      ]);
      const findings = await deepImportsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('ARCH-002: God Files', () => {
    it('flags files with >1000 lines', async () => {
      const longLines = Array.from({ length: 1001 }, (_, i) => `// Line ${i}`).join('\n');
      const ctx = buildCtx([{ path: 'src/God.ts', content: longLines }]);
      const findings = await godFilesRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('ARCH-002');
    });

    it('does not flag reasonably sized files', async () => {
      const ctx = buildCtx([{ path: 'src/App.ts', content: '// lines' }]);
      const findings = await godFilesRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('ARCH-003: Deprecated Dependencies', () => {
    it('flags request dependency', async () => {
      const ctx = buildCtx([], [{ name: 'request', version: '^2.88.2', isDev: false }]);
      const findings = await deprecatedDepsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('ARCH-003');
    });

    it('flags tslint dependency', async () => {
      const ctx = buildCtx([], [{ name: 'tslint', version: '^6.1.3', isDev: true }]);
      const findings = await deprecatedDepsRule.execute(ctx);
      expect(findings).toHaveLength(1);
    });
  });
});
