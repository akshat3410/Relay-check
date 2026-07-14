import type { RuleCategory, Severity, RunOptions, Framework } from '@relay/shared';

/**
 * Common CLI args shared across all review commands.
 * Each command extends these with its own category filter.
 */
export const sharedReviewArgs = {
  cwd: {
    type: 'string' as const,
    description: 'Project root directory (default: current directory)',
    default: process.cwd(),
    alias: 'C',
  },
  format: {
    type: 'string' as const,
    description: 'Output format: terminal | json | markdown | html | sarif | github',
    default: 'terminal',
    alias: 'f',
  },
  output: {
    type: 'string' as const,
    description: 'Write report to file',
    alias: 'o',
  },
  framework: {
    type: 'string' as const,
    description: 'Force framework detection result',
  },
  severity: {
    type: 'string' as const,
    description: 'Minimum severity: critical | high | medium | low | info',
    default: 'info',
    alias: 's',
  },
  ci: {
    type: 'boolean' as const,
    description: 'CI mode: no color, machine-friendly output',
    default: false,
  },
  verbose: {
    type: 'boolean' as const,
    description: 'Verbose debug output',
    default: false,
    alias: 'v',
  },
  config: {
    type: 'string' as const,
    description: 'Config file path (default: auto-detect)',
  },
} as const;

export type SharedReviewArgs = {
  cwd: string;
  format: string;
  output?: string;
  framework?: string;
  severity: string;
  ci: boolean;
  verbose: boolean;
  config?: string;
};

/**
 * Map CLI args → RelayEngine RunOptions
 */
export function toRunOptions(args: SharedReviewArgs, categories?: RuleCategory[]): RunOptions {
  const opts: RunOptions = {
    cwd: args.cwd,
    severity: args.severity as Severity,
  };

  if (args.framework !== undefined) {
    opts.framework = args.framework as Framework | 'auto';
  }

  if (categories !== undefined) {
    opts.categories = categories;
  }

  return opts;
}

/**
 * Determine process exit code from review status.
 *
 * 0 = ship (all pass)
 * 1 = warn (non-blocking warnings)
 * 2 = hold (blocking errors)
 * 3 = critical (block deploy immediately)
 */
export function toExitCode(status: string): number {
  switch (status) {
    case 'ship':
      return 0;
    case 'warn':
      return 1;
    case 'hold':
      return 2;
    case 'critical':
      return 3;
    default:
      return 2;
  }
}
