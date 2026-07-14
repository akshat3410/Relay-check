/**
 * @relay/core
 * Public API surface — only export what consumers should use.
 */

export { RelayEngine } from './engine.js';
export type {
  ConfigLoader,
  ValidatedConfig,
} from './config-loader.js';
export { FrameworkDetector } from './framework-detector.js';

// Re-export shared types for convenience
export type {
  CategoryScore,
  DependencyInfo,
  DetectionResult,
  Finding,
  FindingSummary,
  Framework,
  GitInfo,
  ProjectContext,
  RelayConfig,
  Reporter,
  ReporterOptions,
  ReviewResult,
  ReviewStatus,
  Rule,
  RuleCategory,
  RulePack,
  RunOptions,
  Severity,
  SourceFile,
} from '@relay/shared';

export { SEVERITY_ORDER } from '@relay/shared';

/**
 * Helper for rule pack and relay.config.ts authors.
 * Provides type-safe config definition with IDE autocompletion.
 */
export function defineConfig(
  config: import('@relay/shared').RelayConfig
): import('@relay/shared').RelayConfig {
  return config;
}

/**
 * Helper for rule pack authors.
 * Ensures the rule pack matches the RulePack interface.
 */
export function defineRulePack(
  pack: import('@relay/shared').RulePack
): import('@relay/shared').RulePack {
  return pack;
}
