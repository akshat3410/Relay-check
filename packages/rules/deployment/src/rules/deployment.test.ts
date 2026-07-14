import { describe, it, expect } from 'vitest';
import { missingDockerHealthcheckRule, dockerRunAsRootRule } from './docker.js';
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

describe('Deployment Rules', () => {
  describe('DEPLOY-001: Missing Docker HEALTHCHECK', () => {
    it('flags Dockerfile missing HEALTHCHECK', () => {
      const ctx = buildCtx([{ path: 'Dockerfile', content: 'FROM node:18\nCMD ["node", "index.js"]' }]);
      const findings = missingDockerHealthcheckRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('DEPLOY-001');
    });

    it('does not flag Dockerfile with HEALTHCHECK', () => {
      const ctx = buildCtx([{ path: 'Dockerfile', content: 'FROM node:18\nHEALTHCHECK CMD curl http://localhost || exit 1\nCMD ["node", "index.js"]' }]);
      const findings = missingDockerHealthcheckRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });

  describe('DEPLOY-002: Docker Run As Root', () => {
    it('flags Dockerfile with no USER directive', () => {
      const ctx = buildCtx([{ path: 'Dockerfile', content: 'FROM node:18\nCMD ["node", "index.js"]' }]);
      const findings = dockerRunAsRootRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.ruleId).toBe('DEPLOY-002');
    });

    it('flags Dockerfile with USER root', () => {
      const ctx = buildCtx([{ path: 'Dockerfile', content: 'FROM node:18\nUSER root\nCMD ["node", "index.js"]' }]);
      const findings = dockerRunAsRootRule.execute(ctx);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.message).toContain('explicitly sets USER to root');
    });

    it('does not flag Dockerfile with non-root USER', () => {
      const ctx = buildCtx([{ path: 'Dockerfile', content: 'FROM node:18\nUSER node\nCMD ["node", "index.js"]' }]);
      const findings = dockerRunAsRootRule.execute(ctx);
      expect(findings).toHaveLength(0);
    });
  });
});
