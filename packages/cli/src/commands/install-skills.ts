import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCommand } from 'citty';
import { createConsola } from 'consola';

const logger = createConsola({ level: 4 });

interface InstallSkillsArgs {
  cwd: string;
  providers: string;
  global: boolean;
}

export async function runInstallSkills(args: InstallSkillsArgs): Promise<void> {
  const cwd = args.cwd;
  const providerList = args.providers.split(',').map((p) => p.trim().toLowerCase());
  const isAll = providerList.includes('all');

  console.log('\n  Relay Skill Installer\n  ─────────────────────\n');

  // 1. Resolve source skills directory
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const searchPaths = [
    join(currentFileDir, 'skills'), // dist output
    join(currentFileDir, '../../skills'), // local dev from packages/cli/src/
    join(currentFileDir, '../../../../skills'), // local dev/test from packages/cli/src/commands/
    join(cwd, 'skills'), // local dev fallback from cwd
    join(cwd, 'packages/cli/dist/skills'), // monorepo root pointing to dist
  ];

  let sourceSkillsDir = '';
  for (const p of searchPaths) {
    if (existsSync(p)) {
      sourceSkillsDir = p;
      break;
    }
  }

  if (!sourceSkillsDir) {
    logger.error('Could not locate the Relay skills source directory.');
    process.exit(1);
  }

  logger.info(`Source skills directory: ${sourceSkillsDir}`);

  // 2. Discover skills (directories containing SKILL.md)
  const skillsList: { name: string; content: string }[] = [];
  try {
    const entries = readdirSync(sourceSkillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFilePath = join(sourceSkillsDir, entry.name, 'SKILL.md');
        if (existsSync(skillFilePath)) {
          const content = readFileSync(skillFilePath, 'utf8');
          skillsList.push({ name: entry.name, content });
        }
      }
    }
  } catch (err) {
    logger.error('Failed to read source skills directory:', err);
    process.exit(1);
  }

  if (skillsList.length === 0) {
    logger.warn('No skills found to install.');
    return;
  }

  logger.success(
    `Discovered ${skillsList.length} skills: ${skillsList.map((s) => s.name).join(', ')}`
  );

  // 3. Helper to write/create
  const safeWriteFile = (dir: string, filename: string, content: string) => {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const filePath = join(dir, filename);
      writeFileSync(filePath, content, 'utf8');
      logger.success(`Installed: ${join(dir, filename)}`);
    } catch (err) {
      logger.error(`Failed to write file in ${dir}:`, err);
    }
  };

  // 4. Install for Cursor
  if (isAll || providerList.includes('cursor')) {
    const cursorDir = join(cwd, '.cursor', 'rules');
    logger.info('Installing Cursor rules...');
    for (const skill of skillsList) {
      safeWriteFile(cursorDir, `relay-${skill.name}.md`, skill.content);
    }
  }

  // 5. Install for Claude Code
  if (isAll || providerList.includes('claude')) {
    if (args.global) {
      const globalClaudeDir = join(homedir(), '.claude', 'skills');
      logger.info('Installing Claude Code skills globally...');
      for (const skill of skillsList) {
        safeWriteFile(globalClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
    } else {
      const localClaudeDir = join(cwd, '.claude', 'skills');
      logger.info('Installing Claude Code skills locally...');
      for (const skill of skillsList) {
        safeWriteFile(localClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
    }
  }

  // 6. Install for Generic/Agents
  if (isAll || providerList.includes('agents')) {
    const agentsDir = join(cwd, '.agents', 'skills');
    logger.info('Installing general agent skills...');
    for (const skill of skillsList) {
      safeWriteFile(agentsDir, `relay-${skill.name}.md`, skill.content);
    }
  }

  // 7. Install for Copilot (Combined instructions)
  if (isAll || providerList.includes('copilot')) {
    const githubDir = join(cwd, '.github');
    const copilotFile = join(githubDir, 'copilot-instructions.md');
    logger.info('Installing Copilot instructions...');

    // Combine skills content
    const separatorBegin = '<!-- BEGIN RELAY SKILLS -->';
    const separatorEnd = '<!-- END RELAY SKILLS -->';

    let combinedContent = `${separatorBegin}\n# Relay Assistant Skills\n\n`;
    for (const skill of skillsList) {
      // Strip frontmatter from content to make it clean for Copilot
      let cleanContent = skill.content;
      if (cleanContent.startsWith('---')) {
        const parts = cleanContent.split('---');
        if (parts.length >= 3) {
          cleanContent = parts.slice(2).join('---').trim();
        }
      }
      combinedContent += `## Skill: ${skill.name}\n\n${cleanContent}\n\n`;
    }
    combinedContent += `${separatorEnd}`;

    try {
      if (!existsSync(githubDir)) {
        mkdirSync(githubDir, { recursive: true });
      }

      let finalFileContent = combinedContent;
      if (existsSync(copilotFile)) {
        const existingContent = readFileSync(copilotFile, 'utf8');
        const beginIdx = existingContent.indexOf(separatorBegin);
        const endIdx = existingContent.indexOf(separatorEnd);

        if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
          // Replace existing block
          finalFileContent =
            existingContent.slice(0, beginIdx) +
            combinedContent +
            existingContent.slice(endIdx + separatorEnd.length);
        } else {
          // Append to existing file
          finalFileContent = `${existingContent.trim()}\n\n${combinedContent}\n`;
        }
      }

      writeFileSync(copilotFile, finalFileContent, 'utf8');
      logger.success(`Installed: ${copilotFile}`);
    } catch (err) {
      logger.error('Failed to write Copilot instructions:', err);
    }
  }

  console.log('\n  Relay Skill Installation Complete!\n');
}

export const installSkillsCommand = defineCommand({
  meta: {
    name: 'install-skills',
    description:
      'Automatically install Relay agent skills into AI assistant configuration directories',
  },
  args: {
    cwd: {
      type: 'string' as const,
      description: 'Project root directory',
      default: process.cwd(),
    },
    providers: {
      type: 'string' as const,
      description:
        'Comma-separated assistant providers to install for (cursor, claude, copilot, agents, all)',
      default: 'all',
    },
    global: {
      type: 'boolean' as const,
      description: 'Install Claude skills globally (~/.claude/skills)',
      default: false,
    },
  },
  async run({ args }) {
    await runInstallSkills(args);
  },
});
