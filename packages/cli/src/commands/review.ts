import { RelayEngine } from '@relay/core';
import { defineCommand } from 'citty';
import { renderResult } from '../render.js';
import { sharedReviewArgs, toExitCode, toRunOptions } from '../shared-args.js';

export const reviewCommand = defineCommand({
  meta: {
    name: 'review',
    description: 'Run a full project review across all categories',
  },
  args: {
    ...sharedReviewArgs,
  },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args);

    const result = await engine.run(opts);
    await renderResult(result, args);

    process.exit(toExitCode(result.status));
  },
});
