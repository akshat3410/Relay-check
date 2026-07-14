import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RelayEngine } from '@relay/core';
import { defineCommand } from 'citty';
import { createConsola } from 'consola';

const logger = createConsola({ level: 4 });

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Diagnose your Relay installation and project configuration',
  },
  args: {
    cwd: {
      type: 'string' as const,
      description: 'Project root directory',
      default: process.cwd(),
    },
  },
  async run({ args }) {
    const cwd = args.cwd;
    let allPassed = true;

    console.log('\n  Relay Doctor\n  ────────────\n');

    // Node version
    const nodeVer = process.version;
    const nodeMajor = Number.parseInt(nodeVer.slice(1));
    if (nodeMajor >= 18) {
      logger.success(`Node ${nodeVer} detected (minimum: 18)`);
    } else {
      logger.error(`Node ${nodeVer} — upgrade to 18+ required`);
      allPassed = false;
    }

    // Relay version
    const engine = new RelayEngine();
    logger.success(`@relay/cli ${engine.version}`);

    // Config file
    const configFiles = ['.relayrc.json', 'relay.config.ts', 'relay.config.js'];
    const foundConfig = configFiles.find((f) => existsSync(join(cwd, f)));
    if (foundConfig) {
      logger.success(`Config found: ${foundConfig}`);
      const validation = await engine.validate(null);
      if (validation.valid) {
        logger.success('Config is valid');
      } else {
        logger.error(`Config invalid:\n${validation.errors.join('\n')}`);
        allPassed = false;
      }
    } else {
      logger.warn('No config file found — using defaults');
      logger.info('Run `relay init` to create one');
    }

    // Framework detection
    const detection = await engine.detect(cwd);
    if (detection.framework !== 'unknown') {
      logger.success(
        `Framework detected: ${detection.framework} (${detection.confidence} confidence)`
      );
    } else {
      logger.warn('Framework not detected — may affect rule loading');
    }

    // Lockfile
    const lockfiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb'];
    const foundLock = lockfiles.find((f) => existsSync(join(cwd, f)));
    if (foundLock) {
      logger.success(`Lockfile found: ${foundLock}`);
    } else {
      logger.warn('No lockfile found — consider committing one');
    }

    // Git
    if (existsSync(join(cwd, '.git'))) {
      logger.success('Git repository detected');
    } else {
      logger.warn('Not a git repository');
    }

    console.log('');
    if (allPassed) {
      logger.success('All checks passed — ready to run `relay review`\n');
    } else {
      logger.error('Some checks failed — fix the issues above\n');
      process.exit(1);
    }
  },
});
