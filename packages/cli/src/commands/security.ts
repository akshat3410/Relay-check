import { RelayEngine } from '@relay/core';
import { defineCommand } from 'citty';
import { renderResult } from '../render.js';
import { sharedReviewArgs, toExitCode, toRunOptions } from '../shared-args.js';

export const securityCommand = defineCommand({
  meta: {
    name: 'security',
    description: 'Run a security-focused review (OWASP Top 10, secrets, headers)',
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args, ['security']);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  },
});
