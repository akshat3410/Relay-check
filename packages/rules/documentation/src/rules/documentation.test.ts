import { describe, it, expect } from 'vitest';
import { missingReadmeRule, missingLicenseRule } from './hygiene.js';
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

describe('Documentation Rules', () => {
  describe('DOC-001: Missing README', () => {
    it('flags project with no README', async () => {
      const ctx = buildCtx([{ path: 'index.ts', content: 'const a = 1;' }]);
      const findings = await missingReadmeRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('DOC-001');
    });

    it('does not flag project with README.md', async () => {
      const ctx = buildCtx([{ path: 'README.md', content: '# My Project' }]);
      const findings = await missingReadmeRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('DOC-002: Missing LICENSE', () => {
    it('flags project with no LICENSE', async () => {
      const ctx = buildCtx([{ path: 'README.md', content: '# My Project' }]);
      const findings = await missingLicenseRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('DOC-002');
    });

    it('does not flag project with LICENSE file', async () => {
      const ctx = buildCtx([{ path: 'LICENSE', content: 'MIT License' }]);
      const findings = await missingLicenseRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });
});
