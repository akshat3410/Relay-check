import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runInstallSkills } from './install-skills.js';

describe('install-skills command', () => {
  const tempTestDir = join(__dirname, 'temp-install-test');

  beforeAll(() => {
    if (existsSync(tempTestDir)) {
      rmSync(tempTestDir, { recursive: true, force: true });
    }
    mkdirSync(tempTestDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempTestDir)) {
      rmSync(tempTestDir, { recursive: true, force: true });
    }
  });

  it('should install skills for all default providers', async () => {
    // Run the command
    await runInstallSkills({
      cwd: tempTestDir,
      providers: 'all',
      global: false,
    });

    // Verify Cursor rules
    const cursorRulePath = join(tempTestDir, '.cursor', 'rules', 'relay-qa.md');
    expect(existsSync(cursorRulePath)).toBe(true);
    expect(readFileSync(cursorRulePath, 'utf8')).toContain('QA Review Skill');

    // Verify Claude skills
    const claudeSkillPath = join(tempTestDir, '.claude', 'skills', 'relay-qa.md');
    expect(existsSync(claudeSkillPath)).toBe(true);

    // Verify general agents
    const agentsSkillPath = join(tempTestDir, '.agents', 'skills', 'relay-qa.md');
    expect(existsSync(agentsSkillPath)).toBe(true);

    // Verify Copilot instructions
    const copilotPath = join(tempTestDir, '.github', 'copilot-instructions.md');
    expect(existsSync(copilotPath)).toBe(true);
    const copilotContent = readFileSync(copilotPath, 'utf8');
    expect(copilotContent).toContain('<!-- BEGIN RELAY SKILLS -->');
    expect(copilotContent).toContain('## Skill: qa');
  });

  it('should install only for specific providers when filtered', async () => {
    const specificTempDir = join(__dirname, 'temp-install-specific-test');
    if (existsSync(specificTempDir)) {
      rmSync(specificTempDir, { recursive: true, force: true });
    }
    mkdirSync(specificTempDir, { recursive: true });

    try {
      await runInstallSkills({
        cwd: specificTempDir,
        providers: 'cursor',
        global: false,
      });

      // Verify Cursor is installed
      expect(existsSync(join(specificTempDir, '.cursor', 'rules', 'relay-qa.md'))).toBe(true);

      // Verify Claude and Copilot are NOT installed
      expect(existsSync(join(specificTempDir, '.claude', 'skills', 'relay-qa.md'))).toBe(false);
      expect(existsSync(join(specificTempDir, '.github', 'copilot-instructions.md'))).toBe(false);
    } finally {
      if (existsSync(specificTempDir)) {
        rmSync(specificTempDir, { recursive: true, force: true });
      }
    }
  });
});
