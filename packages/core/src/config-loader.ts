import type { RelayConfig } from '@relay/shared';
import { loadConfig } from 'c12';
import { z } from 'zod';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
const SeverityOverrideSchema = z.union([SeveritySchema, z.enum(['error', 'warn', 'off'])]);

const RelayConfigSchema = z
  .object({
    framework: z
      .union([
        z.enum([
          'nextjs',
          'react',
          'vue',
          'nuxt',
          'angular',
          'svelte',
          'sveltekit',
          'astro',
          'remix',
          'express',
          'fastify',
          'nestjs',
          'hono',
          'fastapi',
          'django',
          'flask',
          'laravel',
          'rails',
          'unknown',
        ]),
        z.literal('auto'),
      ])
      .optional()
      .default('auto'),
    severity: SeveritySchema.optional().default('info'),
    rules: z.record(z.string(), SeverityOverrideSchema).optional().default({}),
    plugins: z.array(z.string()).optional().default([]),
    ignore: z.array(z.string()).optional().default([]),
    report: z
      .object({
        format: z
          .enum(['terminal', 'json', 'markdown', 'html', 'sarif', 'github'])
          .optional()
          .default('terminal'),
        output: z.string().optional(),
      })
      .optional()
      .default({}),
    thresholds: z
      .object({
        score: z.number().min(0).max(100).optional().default(0),
        critical: z.number().min(0).optional().default(0),
        high: z.number().min(0).optional(),
      })
      .optional()
      .default({}),
  })
  .strict();

export type ValidatedConfig = z.infer<typeof RelayConfigSchema>;

/**
 * ConfigLoader
 *
 * Resolution order (highest → lowest priority):
 *   1. Programmatic override (passed directly to engine)
 *   2. .relayrc.json  (project root)
 *   3. relay.config.ts / relay.config.js
 *   4. package.json#relay
 *   5. ~/.config/relay/config.json (user global)
 *   6. Built-in defaults
 */
export class ConfigLoader {
  async load(cwd: string, override?: Partial<RelayConfig>): Promise<ValidatedConfig> {
    const { config: raw } = await loadConfig<Partial<RelayConfig>>({
      name: 'relay',
      cwd,
      defaults: {},
      // c12 automatically checks: relay.config.ts/js, .relayrc.json,
      // package.json#relay, and ~/.config/relay/config.json
    });

    // Merge programmatic override (CLI flags, RunOptions) on top
    const merged = { ...raw, ...override };

    // Validate with Zod — throws on invalid config with a clear message
    const result = RelayConfigSchema.safeParse(merged);

    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid Relay config:\n${issues}`);
    }

    return result.data;
  }
}
