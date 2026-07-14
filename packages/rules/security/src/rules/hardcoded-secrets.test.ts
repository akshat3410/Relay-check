import type { ProjectContext } from '@relay/shared';
import { describe, expect, it } from 'vitest';
import { hardcodedSecretsRule } from './hardcoded-secrets.js';

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

describe('SEC-001: Hardcoded Secrets', () => {
  it('detects AWS Access Key ID', async () => {
    const ctx = buildCtx([{ path: 'config.ts', content: 'const key = "AKIA3K9EXAMPLE123456"' }]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.severity).toBe('critical');
    expect(findings[0]?.ruleId).toBe('SEC-001');
  });

  it('detects GitHub PAT', async () => {
    const ctx = buildCtx([
      { path: 'deploy.ts', content: 'const token = "ghp_abcdefghijklmnopqrstuvwxyz123456"' },
    ]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.severity).toBe('critical');
  });

  it('does not flag process.env references', async () => {
    const ctx = buildCtx([{ path: 'config.ts', content: 'const key = process.env.API_KEY' }]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings).toHaveLength(0);
  });

  it('does not flag .env.example files', async () => {
    const ctx = buildCtx([
      { path: '.env.example', content: 'API_KEY=your_key_here_AKIA3K9EXAMPLE1234' },
    ]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings).toHaveLength(0);
  });

  it('does not flag commented lines', async () => {
    const ctx = buildCtx([{ path: 'config.ts', content: '// const key = "AKIA3K9EXAMPLE1234"' }]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings).toHaveLength(0);
  });

  it('returns ruleId, file, and line for every finding', async () => {
    const ctx = buildCtx([
      {
        path: 'src/api.ts',
        content: 'const openaiKey = "sk-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"',
      },
    ]);
    const findings = await hardcodedSecretsRule.execute(ctx);
    expect(findings.length).toBeGreaterThan(0);
    const f = findings[0];
    expect(f).toBeDefined();
    if (!f) return;
    expect(f.ruleId).toBe('SEC-001');
    expect(f.file).toBe('src/api.ts');
    expect(f.line).toBeTypeOf('number');
    expect(f.suggestion).toBeTruthy();
  });
});
