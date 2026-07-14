import type { DetectionResult, RelayConfig, ReviewResult, RunOptions } from '@relay/shared';
import { createConsola } from 'consola';
import { ConfigLoader } from './config-loader.js';
import { ContextBuilder } from './context-builder.js';
import { FrameworkDetector } from './framework-detector.js';
import { PluginRegistry } from './plugin-registry.js';
import { RuleRunner } from './rule-runner.js';

// Injected at build time by tsup define
declare const __RELAY_VERSION__: string;
const RELAY_VERSION = typeof __RELAY_VERSION__ !== 'undefined' ? __RELAY_VERSION__ : '0.0.0-dev';

const logger = createConsola({ level: 3 });

/**
 * RelayEngine
 *
 * The single, transport-agnostic entry point to the Relay review system.
 *
 * Design contract:
 *  - No knowledge of CLI, MCP, HTTP, or any transport.
 *  - Called identically by @relay/cli (V1) and @relay/mcp-server (V2).
 *  - Never modifies files. Read-only analysis only.
 *  - All public methods return plain JSON-serializable objects.
 *
 * Usage:
 *  ```ts
 *  const engine = new RelayEngine();
 *  const result = await engine.run({ cwd: '/path/to/project' });
 *  ```
 */
export class RelayEngine {
  private readonly configLoader = new ConfigLoader();

  /**
   * Run a full project review.
   *
   * This is the primary method. CLI calls this. MCP server (V2) will call this.
   * Return value is always plain JSON — any reporter can render it.
   */
  async run(opts: RunOptions = {}): Promise<ReviewResult> {
    const cwd = opts.cwd ?? process.cwd();
    const startTime = Date.now();

    logger.debug(`RelayEngine.run() starting — cwd: ${cwd}`);

    // 1. Load and validate config
    const config = await this.configLoader.load(cwd, opts.config);

    // 2. Detect framework
    const detection = await this.detect(
      cwd,
      opts.framework === 'auto' ? undefined : opts.framework
    );
    const framework =
      opts.framework && opts.framework !== 'auto' ? opts.framework : detection.framework;

    logger.debug(`Framework detected: ${framework} (confidence: ${detection.confidence})`);

    // 3. Build project context
    const contextBuilder = new ContextBuilder({
      cwd,
      framework,
      allFrameworks: detection.allFrameworks,
      relayVersion: RELAY_VERSION,
      ...(opts.include !== undefined ? { include: opts.include } : {}),
      exclude: [...(config.ignore ?? []), ...(opts.exclude ?? [])],
      meta: config as unknown as Record<string, unknown>,
    });

    const ctx = await contextBuilder.build();
    logger.debug(`Context built: ${ctx.sourceFiles.length} files collected`);

    // 4. Discover and load rules
    const registry = new PluginRegistry(cwd);
    const allRules = await registry.discover(config.plugins);
    logger.debug(`Rules loaded: ${allRules.length}`);

    // 5. Run rules
    const runner = new RuleRunner({
      minSeverity: opts.severity ?? config.severity,
      ...(opts.categories !== undefined ? { categories: opts.categories } : {}),
      severityOverrides: config.rules,
    });

    const result = await runner.run(ctx, allRules, RELAY_VERSION);

    logger.debug(
      `Review complete in ${Date.now() - startTime}ms — score: ${result.score}/100 (${result.status})`
    );

    return result;
  }

  /**
   * Detect the framework used by a project.
   *
   * Useful for MCP tool: relay_detect
   * Also called internally by run().
   */
  async detect(
    cwd?: string,
    frameworkOverride?: RunOptions['framework']
  ): Promise<DetectionResult> {
    const projectCwd = cwd ?? process.cwd();

    if (frameworkOverride && frameworkOverride !== 'auto') {
      return {
        framework: frameworkOverride,
        allFrameworks: [frameworkOverride],
        confidence: 'high',
        evidence: ['User override via config/CLI'],
      };
    }

    const detector = new FrameworkDetector(projectCwd);
    return detector.detect();
  }

  /**
   * Validate a config object against the Relay config schema.
   *
   * Returns { valid: true } or { valid: false, errors: [...] }
   * Useful for: relay doctor, MCP tool: relay_validate_config
   */
  async validate(config: unknown): Promise<{ valid: true } | { valid: false; errors: string[] }> {
    try {
      await this.configLoader.load(process.cwd(), config as Partial<RelayConfig>);
      return { valid: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { valid: false, errors: [message] };
    }
  }

  /**
   * Get the current Relay version.
   */
  get version(): string {
    return RELAY_VERSION;
  }
}

// Re-export engine and all sub-modules for consumers that need them
export { ConfigLoader } from './config-loader.js';
export { ContextBuilder } from './context-builder.js';
export { FrameworkDetector } from './framework-detector.js';
export { PluginRegistry } from './plugin-registry.js';
export { RuleRunner } from './rule-runner.js';
