import { defineCommand, runMain } from 'citty';
import { doctorCommand } from './commands/doctor.js';
import { initCommand } from './commands/init.js';
import {
  accessibilityCommand,
  architectureCommand,
  performanceCommand,
  reportCommand,
  versionCommand,
} from './commands/misc.js';
import { releaseCommand } from './commands/release.js';
import { reviewCommand } from './commands/review.js';
import { securityCommand } from './commands/security.js';

const main = defineCommand({
  meta: {
    name: 'relay',
    version: '0.1.0',
    description: 'Developer review platform — QA, security, release, architecture',
  },
  subCommands: {
    review: reviewCommand,
    release: releaseCommand,
    security: securityCommand,
    accessibility: accessibilityCommand,
    architecture: architectureCommand,
    performance: performanceCommand,
    report: reportCommand,
    doctor: doctorCommand,
    init: initCommand,
    version: versionCommand,
  },
});

runMain(main);
