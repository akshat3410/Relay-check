import { RelayEngine } from '@relay/core';
import { defineCommand } from 'citty';
import { renderResult } from '../render.js';
import { sharedReviewArgs, toExitCode, toRunOptions } from '../shared-args.js';

export const releaseCommand = defineCommand({
  meta: {
    name: 'release',
    description: 'Release readiness gate — tests, changelog, version, deps',
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args, ['testing', 'deployment', 'security', 'documentation']);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  },
});
