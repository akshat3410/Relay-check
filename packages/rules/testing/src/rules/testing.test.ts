import { describe, it, expect } from 'vitest';
import { emptyTestsRule } from './empty-tests.js';
import { noTestsRule } from './no-tests.js';
import { skippedFocusedTestsRule } from './skipped-focused-tests.js';
import type { ProjectContext } from '@relay/shared';

function buildCtx(
  files: Array<{ path: string; content: string }>,
  deps: Array<{ name: string; version: string; isDev: boolean }> = []
): ProjectContext {
  return {
    cwd: '/test',
    framework: 'react',
    allFrameworks: ['react'],
    packageJson: null,
    dependencies: deps,
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

describe('Testing Rules', () => {
  describe('TEST-001: Empty or Mock Test Files', () => {
    it('flags completely empty test files', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: '' }]);
      const findings = emptyTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-001');
      expect(findings[0]?.severity).toBe('high');
    });

    it('flags test files with no test declarations', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'console.log("hello");' }]);
      const findings = emptyTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-001');
      expect(findings[0]?.severity).toBe('medium');
    });

    it('does not flag valid test files', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'describe("App", () => { it("works", () => {}) })' }]);
      const findings = emptyTestsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('TEST-002: No Test Suite Configured', () => {
    it('flags missing test setup completely', () => {
      const ctx = buildCtx([{ path: 'App.ts', content: 'const a = 1;' }], []);
      const findings = noTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-002');
      expect(findings[0]?.severity).toBe('high');
    });

    it('flags when framework installed but no test files found', () => {
      const ctx = buildCtx([{ path: 'App.ts', content: 'const a = 1;' }], [{ name: 'vitest', version: '^1.0.0', isDev: true }]);
      const findings = noTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-002');
      expect(findings[0]?.severity).toBe('medium');
    });

    it('does not flag when test files exist', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'test("a", () => {})' }], [{ name: 'vitest', version: '^1.0.0', isDev: true }]);
      const findings = noTestsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('TEST-003: Focused or Skipped Tests', () => {
    it('flags .only in test files', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'describe.only("App", () => {})' }]);
      const findings = skippedFocusedTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-003');
      expect(findings[0]?.severity).toBe('high');
    });

    it('flags fit in test files', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'fit("App", () => {})' }]);
      const findings = skippedFocusedTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe('high');
    });

    it('flags .skip in test files', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: 'test.skip("App", () => {})' }]);
      const findings = skippedFocusedTestsRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('TEST-003');
      expect(findings[0]?.severity).toBe('medium');
    });

    it('does not flag commented out .only or .skip', () => {
      const ctx = buildCtx([{ path: 'App.test.ts', content: '// test.skip("App", () => {})' }]);
      const findings = skippedFocusedTestsRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });
});
