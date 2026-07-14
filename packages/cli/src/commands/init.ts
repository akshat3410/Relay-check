import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineCommand } from 'citty';
import { createConsola } from 'consola';

const logger = createConsola({ level: 4 });

const DEFAULT_CONFIG = {
  $schema: 'https://relay.dev/schema/config.json',
  framework: 'auto',
  severity: 'info',
  rules: {},
  plugins: [],
  ignore: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'],
  report: {
    format: 'terminal',
  },
  thresholds: {
    score: 0,
    critical: 0,
  },
};

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize Relay in the current project',
  },
  args: {
    cwd: {
      type: 'string' as const,
      description: 'Project root directory',
      default: process.cwd(),
    },
    force: {
      type: 'boolean' as const,
      description: 'Overwrite existing config',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = args.cwd;
    const configPath = join(cwd, '.relayrc.json');

    console.log('\n  Relay Init\n  ──────────\n');

    if (existsSync(configPath) && !args.force) {
      logger.warn('.relayrc.json already exists. Use --force to overwrite.');
      return;
    }

    // Write .relayrc.json
    writeFileSync(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, 'utf8');
    logger.success('Created .relayrc.json');

    // Suggest next steps
    console.log('\n  Next steps:\n');
    console.log('    1. Review .relayrc.json and adjust thresholds');
    console.log('    2. Install rule packs:');
    console.log('       pnpm add -D @relay/rules-security @relay/rules-accessibility');
    console.log('    3. Run your first review:');
    console.log('       relay review');
    console.log('');
  },
});
