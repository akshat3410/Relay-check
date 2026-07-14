import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { Rule, RulePack } from '@relay/shared';
import { createConsola } from 'consola';

const logger = createConsola({ level: 3 });
const require = createRequire(import.meta.url);

/**
 * PluginRegistry
 *
 * Discovers and loads rule packs from three sources:
 *   1. Built-in packs (installed as workspace packages)
 *   2. npm-published packs (node_modules matching /^relay-rules-/)
 *   3. Local rules (.relay/rules/*.js)
 *
 * Rule validation prevents malformed packs from crashing the engine.
 */
export class PluginRegistry {
  private readonly builtinPackNames: string[] = [
    '@relay/rules-security',
    '@relay/rules-accessibility',
    '@relay/rules-performance',
    '@relay/rules-testing',
    '@relay/rules-architecture',
    '@relay/rules-deployment',
    '@relay/rules-documentation',
  ];

  constructor(private readonly cwd: string) {}

  async discover(pluginNames?: string[]): Promise<Rule[]> {
    const allRules: Rule[] = [];

    // 1. Built-in packs
    for (const pkgName of this.builtinPackNames) {
      const rules = await this.loadPack(pkgName);
      allRules.push(...rules);
    }

    // 2. Explicit plugin names from config (may include npm packs or local paths)
    for (const name of pluginNames ?? []) {
      if (this.builtinPackNames.includes(name)) continue; // already loaded
      const rules = await this.loadPack(name);
      allRules.push(...rules);
    }

    // 3. Auto-discover relay-rules-* packages in node_modules
    const autoDiscovered = await this.discoverNpmPacks();
    for (const name of autoDiscovered) {
      if (this.builtinPackNames.includes(name)) continue;
      if ((pluginNames ?? []).includes(name)) continue;
      const rules = await this.loadPack(name);
      allRules.push(...rules);
    }

    // 4. Local rules from .relay/rules/
    const localRules = await this.loadLocalRules();
    allRules.push(...localRules);

    // Validate all rules — remove invalid ones with warnings
    const valid = allRules.filter((r) => this.validateRule(r));

    // Check for ID conflicts
    this.checkDuplicateIds(valid);

    logger.debug(`PluginRegistry: loaded ${valid.length} rules from ${allRules.length} candidates`);

    return valid;
  }

  private async loadPack(nameOrPath: string): Promise<Rule[]> {
    try {
      // Try to resolve relative to project cwd first, then globally
      let resolved: string;
      try {
        resolved = require.resolve(nameOrPath, { paths: [this.cwd] });
      } catch {
        resolved = require.resolve(nameOrPath);
      }

      const mod = (await import(resolved)) as { default?: RulePack; rules?: Rule[] };
      const pack = mod.default ?? (mod as unknown as RulePack);

      if (pack && 'rules' in pack && Array.isArray(pack.rules)) {
        logger.debug(`Loaded pack: ${nameOrPath} (${pack.rules.length} rules)`);
        return pack.rules;
      }

      // Handle flat export of rules array
      if (Array.isArray(mod)) return mod as Rule[];

      logger.warn(`Pack ${nameOrPath} has no valid "rules" export — skipping`);
      return [];
    } catch {
      // Pack not installed — silent skip for builtins, warn for user-specified
      return [];
    }
  }

  private async discoverNpmPacks(): Promise<string[]> {
    const nodeModules = join(this.cwd, 'node_modules');
    if (!existsSync(nodeModules)) return [];

    const packs: string[] = [];

    try {
      const entries = readdirSync(nodeModules, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('relay-rules-')) {
          packs.push(entry.name);
        }
        // Handle scoped packages
        if (entry.isDirectory() && entry.name.startsWith('@')) {
          const scopeDir = join(nodeModules, entry.name);
          try {
            const scoped = readdirSync(scopeDir, { withFileTypes: true });
            for (const s of scoped) {
              if (s.isDirectory() && s.name.startsWith('relay-rules-')) {
                packs.push(`${entry.name}/${s.name}`);
              }
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch {
      /* node_modules not readable */
    }

    return packs;
  }

  private async loadLocalRules(): Promise<Rule[]> {
    const localDir = join(this.cwd, '.relay', 'rules');
    if (!existsSync(localDir)) return [];

    const rules: Rule[] = [];

    try {
      const files = readdirSync(localDir).filter(
        (f) => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.ts')
      );

      for (const file of files) {
        try {
          const mod = (await import(join(localDir, file))) as { default?: Rule | Rule[] };
          const exported = mod.default;
          if (Array.isArray(exported)) {
            rules.push(...exported);
          } else if (exported && typeof exported === 'object' && 'id' in exported) {
            rules.push(exported as Rule);
          }
        } catch (err) {
          logger.warn(`Failed to load local rule ${file}:`, err);
        }
      }
    } catch {
      /* dir not readable */
    }

    return rules;
  }

  private validateRule(rule: unknown): rule is Rule {
    if (!rule || typeof rule !== 'object') return false;
    const r = rule as Record<string, unknown>;

    const required = [
      'id',
      'name',
      'category',
      'severity',
      'description',
      'rationale',
      'docs',
      'execute',
    ];
    for (const field of required) {
      if (!(field in r)) {
        logger.warn(`Rule missing required field "${field}" — skipping`);
        return false;
      }
    }

    if (typeof r.execute !== 'function') {
      logger.warn(`Rule ${r.id}: "execute" must be a function — skipping`);
      return false;
    }

    return true;
  }

  private checkDuplicateIds(rules: Rule[]): void {
    const seen = new Map<string, string>();
    for (const rule of rules) {
      if (seen.has(rule.id)) {
        logger.warn(
          `Duplicate rule ID "${rule.id}" (${rule.name} conflicts with ${seen.get(rule.id)})`
        );
      } else {
        seen.set(rule.id, rule.name);
      }
    }
  }
}
