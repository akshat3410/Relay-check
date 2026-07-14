import { RelayEngine } from '@relay/core';
import { defineCommand } from 'citty';
import { renderResult } from '../render.js';
import { sharedReviewArgs, toExitCode, toRunOptions } from '../shared-args.js';

export const accessibilityCommand = defineCommand({
  meta: { name: 'accessibility', description: 'Accessibility review (WCAG 2.1)' },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ['accessibility']));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  },
});

export const architectureCommand = defineCommand({
  meta: { name: 'architecture', description: 'Architecture review — coupling, patterns, deps' },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ['architecture']));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  },
});

export const performanceCommand = defineCommand({
  meta: { name: 'performance', description: 'Performance review — bundle, rendering, caching' },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ['performance']));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  },
});

export const reportCommand = defineCommand({
  meta: { name: 'report', description: 'Re-render a saved scan result in a different format' },
  args: {
    input: {
      type: 'string' as const,
      description: 'Path to saved JSON scan result',
      required: true,
    },
    format: {
      type: 'string' as const,
      description: 'Output format: terminal | json | markdown | html | sarif | github',
      default: 'terminal',
    },
    output: {
      type: 'string' as const,
      description: 'Write to file',
    },
  },
  async run({ args }) {
    const { readFileSync } = await import('node:fs');
    const { renderResult } = await import('../render.js');
    const raw = readFileSync(args.input, 'utf8');
    const result = JSON.parse(raw);
    await renderResult(result, {
      format: args.format,
      output: args.output,
      ci: false,
      verbose: false,
    });
  },
});

export const versionCommand = defineCommand({
  meta: { name: 'version', description: 'Show Relay version information' },
  args: {},
  run() {
    const engine = new RelayEngine();
    console.log(`relay ${engine.version}`);
  },
});
