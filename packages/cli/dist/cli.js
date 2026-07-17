#!/usr/bin/env node
import {
  SEVERITY_ORDER
} from "./chunk-36XKIQSH.js";
import {
  renderResult
} from "./chunk-FEMG3LOV.js";
import "./chunk-ZWE3DS7E.js";

// src/cli.ts
import { defineCommand as defineCommand8, runMain } from "citty";

// src/commands/doctor.ts
import { existsSync as existsSync2 } from "fs";
import { join as join2 } from "path";

// ../core/dist/index.js
import { createConsola } from "consola";
import { loadConfig } from "c12";
import { z } from "zod";
import { existsSync, readFileSync, statSync, readdirSync } from "fs";
import { join, relative } from "path";
import fg from "fast-glob";
import { simpleGit } from "simple-git";
import { createRequire } from "module";
var SeveritySchema = z.enum(["critical", "high", "medium", "low", "info"]);
var SeverityOverrideSchema = z.union([SeveritySchema, z.enum(["error", "warn", "off"])]);
var RelayConfigSchema = z.object({
  framework: z.union([
    z.enum([
      "nextjs",
      "react",
      "vue",
      "nuxt",
      "angular",
      "svelte",
      "sveltekit",
      "astro",
      "remix",
      "express",
      "fastify",
      "nestjs",
      "hono",
      "fastapi",
      "django",
      "flask",
      "laravel",
      "rails",
      "unknown"
    ]),
    z.literal("auto")
  ]).optional().default("auto"),
  severity: SeveritySchema.optional().default("info"),
  rules: z.record(z.string(), SeverityOverrideSchema).optional().default({}),
  plugins: z.array(z.string()).optional().default([]),
  ignore: z.array(z.string()).optional().default([]),
  report: z.object({
    format: z.enum(["terminal", "json", "markdown", "html", "sarif", "github"]).optional().default("terminal"),
    output: z.string().optional()
  }).optional().default({}),
  thresholds: z.object({
    score: z.number().min(0).max(100).optional().default(0),
    critical: z.number().min(0).optional().default(0),
    high: z.number().min(0).optional()
  }).optional().default({})
}).strict();
var ConfigLoader = class {
  async load(cwd, override) {
    const { config: raw } = await loadConfig({
      name: "relay",
      cwd,
      defaults: {}
      // c12 automatically checks: relay.config.ts/js, .relayrc.json,
      // package.json#relay, and ~/.config/relay/config.json
    });
    const merged = { ...raw, ...override };
    const result = RelayConfigSchema.safeParse(merged);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `  \u2022 ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid Relay config:
${issues}`);
    }
    return result.data;
  }
};
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "vue",
  "svelte",
  "astro",
  "py",
  "go",
  "rb",
  "php",
  "json",
  "yaml",
  "yml",
  "toml",
  "env",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "md",
  "mdx"
]);
var MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
var DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.git/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/*.min.js",
  "**/*.min.css",
  "**/*.map"
];
var ContextBuilder = class {
  constructor(opts) {
    this.opts = opts;
  }
  opts;
  async build() {
    const [packageJson, sourceFiles, git] = await Promise.all([
      this.readPackageJson(),
      this.collectSourceFiles(),
      this.collectGitInfo()
    ]);
    const dependencies = this.extractDependencies(packageJson);
    const configFiles = this.findConfigFiles();
    const packageManager = this.detectPackageManager();
    return {
      cwd: this.opts.cwd,
      framework: this.opts.framework,
      allFrameworks: this.opts.allFrameworks,
      packageJson,
      dependencies,
      sourceFiles,
      configFiles,
      git,
      hasLockfile: this.hasLockfile(),
      packageManager,
      scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
      relayVersion: this.opts.relayVersion,
      meta: this.opts.meta ?? {}
    };
  }
  async readPackageJson() {
    const path = join(this.opts.cwd, "package.json");
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      return null;
    }
  }
  async collectSourceFiles() {
    const ignore = [...DEFAULT_IGNORE, ...this.opts.exclude ?? []];
    const include = this.opts.include ?? ["**/*"];
    const paths = await fg(include, {
      cwd: this.opts.cwd,
      ignore,
      onlyFiles: true,
      followSymbolicLinks: false,
      absolute: true
    });
    const files = [];
    for (const absPath of paths) {
      const ext = absPath.split(".").pop() ?? "";
      if (!SOURCE_EXTENSIONS.has(ext)) continue;
      try {
        const stat = statSync(absPath);
        if (stat.size > MAX_FILE_SIZE_BYTES) continue;
        const content = readFileSync(absPath, "utf8");
        const lines = content.split("\n");
        files.push({
          path: absPath,
          relativePath: relative(this.opts.cwd, absPath),
          extension: ext,
          content,
          lines,
          sizeBytes: stat.size
        });
      } catch {
      }
    }
    return files;
  }
  async collectGitInfo() {
    if (!existsSync(join(this.opts.cwd, ".git"))) return null;
    try {
      const git = simpleGit(this.opts.cwd);
      const [log, status, remotes] = await Promise.all([
        git.log({ maxCount: 1 }),
        git.status(),
        git.getRemotes(true)
      ]);
      const latest = log.latest;
      const remote = remotes[0];
      const rawUrl = remote?.refs?.fetch ?? null;
      const remoteUrl = rawUrl ? rawUrl.replace(/https?:\/\/[^@]+@/, "https://") : null;
      return {
        branch: status.current,
        commitHash: latest?.hash?.slice(0, 8) ?? null,
        commitMessage: latest?.message ?? null,
        commitAuthor: latest?.author_name ?? null,
        commitDate: latest?.date ?? null,
        uncommittedChanges: status.files.length,
        hasRemote: remotes.length > 0,
        remoteUrl
      };
    } catch {
      return null;
    }
  }
  extractDependencies(pkg) {
    if (!pkg) return [];
    const deps = [];
    const add = (obj, isDev, isPeer) => {
      if (!obj || typeof obj !== "object") return;
      for (const [name, version] of Object.entries(obj)) {
        deps.push({ name, version: String(version), isDev, isPeer });
      }
    };
    add(pkg.dependencies, false, false);
    add(pkg.devDependencies, true, false);
    add(pkg.peerDependencies, false, true);
    return deps;
  }
  findConfigFiles() {
    const candidates = [
      ".relayrc.json",
      "relay.config.ts",
      "relay.config.js",
      "next.config.js",
      "next.config.ts",
      "next.config.mjs",
      "vite.config.ts",
      "vite.config.js",
      "tsconfig.json",
      "jsconfig.json",
      ".env",
      ".env.local",
      ".env.production",
      "docker-compose.yml",
      "docker-compose.yaml",
      "Dockerfile",
      ".github/workflows",
      "vercel.json",
      "netlify.toml",
      "fly.toml"
    ];
    return candidates.filter((f) => existsSync(join(this.opts.cwd, f)));
  }
  hasLockfile() {
    return existsSync(join(this.opts.cwd, "pnpm-lock.yaml")) || existsSync(join(this.opts.cwd, "package-lock.json")) || existsSync(join(this.opts.cwd, "yarn.lock")) || existsSync(join(this.opts.cwd, "bun.lockb"));
  }
  detectPackageManager() {
    if (existsSync(join(this.opts.cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(this.opts.cwd, "yarn.lock"))) return "yarn";
    if (existsSync(join(this.opts.cwd, "bun.lockb"))) return "bun";
    if (existsSync(join(this.opts.cwd, "package-lock.json"))) return "npm";
    return "unknown";
  }
};
var FrameworkDetector = class {
  constructor(cwd) {
    this.cwd = cwd;
  }
  cwd;
  detect() {
    const evidence = [];
    const detected = [];
    const pkg = this.readPackageJson();
    const deps = this.allDeps(pkg);
    if (deps.has("next")) {
      detected.push("nextjs");
      evidence.push('package.json: "next" dependency');
    }
    if (deps.has("nuxt") || deps.has("nuxt3")) {
      detected.push("nuxt");
      evidence.push('package.json: "nuxt" dependency');
    }
    if (deps.has("react") && !detected.includes("nextjs") && !detected.includes("remix")) {
      detected.push("react");
      evidence.push('package.json: "react" dependency (no Next.js/Remix)');
    }
    if (deps.has("vue") && !detected.includes("nuxt")) {
      detected.push("vue");
      evidence.push('package.json: "vue" dependency');
    }
    if (deps.has("@angular/core")) {
      detected.push("angular");
      evidence.push('package.json: "@angular/core" dependency');
    }
    if (deps.has("svelte") && !deps.has("@sveltejs/kit")) {
      detected.push("svelte");
      evidence.push('package.json: "svelte" dependency');
    }
    if (deps.has("@sveltejs/kit")) {
      detected.push("sveltekit");
      evidence.push('package.json: "@sveltejs/kit" dependency');
    }
    if (deps.has("astro")) {
      detected.push("astro");
      evidence.push('package.json: "astro" dependency');
    }
    if (deps.has("@remix-run/react") || deps.has("@remix-run/node")) {
      detected.push("remix");
      evidence.push('package.json: "@remix-run/*" dependency');
    }
    if (deps.has("express")) {
      detected.push("express");
      evidence.push('package.json: "express" dependency');
    }
    if (deps.has("fastify")) {
      detected.push("fastify");
      evidence.push('package.json: "fastify" dependency');
    }
    if (deps.has("@nestjs/core")) {
      detected.push("nestjs");
      evidence.push('package.json: "@nestjs/core" dependency');
    }
    if (deps.has("hono")) {
      detected.push("hono");
      evidence.push('package.json: "hono" dependency');
    }
    if (this.fileExists("next.config.js") || this.fileExists("next.config.ts") || this.fileExists("next.config.mjs")) {
      if (!detected.includes("nextjs")) {
        detected.push("nextjs");
        evidence.push("Config file: next.config.*");
      }
    }
    if (this.fileExists("nuxt.config.ts") || this.fileExists("nuxt.config.js")) {
      if (!detected.includes("nuxt")) {
        detected.push("nuxt");
        evidence.push("Config file: nuxt.config.*");
      }
    }
    if (this.fileExists("astro.config.mjs") || this.fileExists("astro.config.ts")) {
      if (!detected.includes("astro")) {
        detected.push("astro");
        evidence.push("Config file: astro.config.*");
      }
    }
    if (this.fileExists("remix.config.js") || this.fileExists("vite.config.ts") && deps.has("@remix-run/react")) {
      if (!detected.includes("remix")) {
        detected.push("remix");
        evidence.push("Config file: remix.config.js");
      }
    }
    if (this.fileExists("angular.json")) {
      if (!detected.includes("angular")) {
        detected.push("angular");
        evidence.push("Config file: angular.json");
      }
    }
    if (this.fileExists("svelte.config.js") || this.fileExists("svelte.config.ts")) {
      if (!detected.includes("sveltekit") && !detected.includes("svelte")) {
        detected.push("sveltekit");
        evidence.push("Config file: svelte.config.*");
      }
    }
    if (this.fileExists("requirements.txt") || this.fileExists("pyproject.toml")) {
      const reqContent = this.fileExists("requirements.txt") ? this.readFile("requirements.txt") : this.readFile("pyproject.toml");
      if (reqContent.includes("fastapi")) {
        detected.push("fastapi");
        evidence.push("requirements.txt: fastapi");
      } else if (reqContent.includes("django")) {
        detected.push("django");
        evidence.push("requirements.txt: django");
      } else if (reqContent.includes("flask")) {
        detected.push("flask");
        evidence.push("requirements.txt: flask");
      }
    }
    if (this.fileExists("composer.json")) {
      const composer = this.readFile("composer.json");
      if (composer.includes("laravel/framework")) {
        detected.push("laravel");
        evidence.push("composer.json: laravel/framework");
      }
    }
    if (this.fileExists("Gemfile")) {
      const gemfile = this.readFile("Gemfile");
      if (gemfile.includes("rails")) {
        detected.push("rails");
        evidence.push("Gemfile: rails");
      }
    }
    const primary = this.resolvePrimary(detected);
    const confidence = this.calcConfidence(detected, evidence);
    return {
      framework: primary,
      allFrameworks: detected,
      confidence,
      evidence
    };
  }
  resolvePrimary(detected) {
    if (detected.length === 0) return "unknown";
    const priority = [
      "nextjs",
      "nuxt",
      "remix",
      "sveltekit",
      "astro",
      "nestjs",
      "angular",
      "react",
      "vue",
      "svelte",
      "express",
      "fastify",
      "hono",
      "fastapi",
      "django",
      "flask",
      "laravel",
      "rails"
    ];
    for (const fw of priority) {
      if (detected.includes(fw)) return fw;
    }
    return detected[0] ?? "unknown";
  }
  calcConfidence(detected, evidence) {
    if (evidence.length >= 2) return "high";
    if (detected.length > 0) return "medium";
    return "low";
  }
  readPackageJson() {
    const pkgPath = join(this.cwd, "package.json");
    if (!existsSync(pkgPath)) return {};
    try {
      return JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      return {};
    }
  }
  allDeps(pkg) {
    const deps = /* @__PURE__ */ new Set();
    for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
      const section = pkg[key];
      if (section && typeof section === "object") {
        for (const dep of Object.keys(section)) {
          deps.add(dep);
        }
      }
    }
    return deps;
  }
  fileExists(filename) {
    return existsSync(join(this.cwd, filename));
  }
  readFile(filename) {
    try {
      return readFileSync(join(this.cwd, filename), "utf8");
    } catch {
      return "";
    }
  }
};
var logger = createConsola({ level: 3 });
var require2 = createRequire(import.meta.url);
var PluginRegistry = class {
  constructor(cwd) {
    this.cwd = cwd;
  }
  cwd;
  builtinPackNames = [
    "@relay/rules-security",
    "@relay/rules-accessibility",
    "@relay/rules-performance",
    "@relay/rules-testing",
    "@relay/rules-architecture",
    "@relay/rules-deployment",
    "@relay/rules-documentation"
  ];
  async discover(pluginNames) {
    const allRules = [];
    for (const pkgName of this.builtinPackNames) {
      const rules = await this.loadPack(pkgName);
      allRules.push(...rules);
    }
    for (const name of pluginNames ?? []) {
      if (this.builtinPackNames.includes(name)) continue;
      const rules = await this.loadPack(name);
      allRules.push(...rules);
    }
    const autoDiscovered = await this.discoverNpmPacks();
    for (const name of autoDiscovered) {
      if (this.builtinPackNames.includes(name)) continue;
      if ((pluginNames ?? []).includes(name)) continue;
      const rules = await this.loadPack(name);
      allRules.push(...rules);
    }
    const localRules = await this.loadLocalRules();
    allRules.push(...localRules);
    const valid = allRules.filter((r) => this.validateRule(r));
    this.checkDuplicateIds(valid);
    logger.debug(`PluginRegistry: loaded ${valid.length} rules from ${allRules.length} candidates`);
    return valid;
  }
  async loadPack(nameOrPath) {
    try {
      let resolved;
      try {
        resolved = require2.resolve(nameOrPath, { paths: [this.cwd] });
      } catch {
        resolved = require2.resolve(nameOrPath);
      }
      const mod = await import(resolved);
      const pack = mod.default ?? mod;
      if (pack && "rules" in pack && Array.isArray(pack.rules)) {
        logger.debug(`Loaded pack: ${nameOrPath} (${pack.rules.length} rules)`);
        return pack.rules;
      }
      if (Array.isArray(mod)) return mod;
      logger.warn(`Pack ${nameOrPath} has no valid "rules" export \u2014 skipping`);
      return [];
    } catch {
      return [];
    }
  }
  async discoverNpmPacks() {
    const nodeModules = join(this.cwd, "node_modules");
    if (!existsSync(nodeModules)) return [];
    const packs = [];
    try {
      const entries = readdirSync(nodeModules, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("relay-rules-")) {
          packs.push(entry.name);
        }
        if (entry.isDirectory() && entry.name.startsWith("@")) {
          const scopeDir = join(nodeModules, entry.name);
          try {
            const scoped = readdirSync(scopeDir, { withFileTypes: true });
            for (const s of scoped) {
              if (s.isDirectory() && s.name.startsWith("relay-rules-")) {
                packs.push(`${entry.name}/${s.name}`);
              }
            }
          } catch {
          }
        }
      }
    } catch {
    }
    return packs;
  }
  async loadLocalRules() {
    const localDir = join(this.cwd, ".relay", "rules");
    if (!existsSync(localDir)) return [];
    const rules = [];
    try {
      const files = readdirSync(localDir).filter(
        (f) => f.endsWith(".js") || f.endsWith(".mjs") || f.endsWith(".ts")
      );
      for (const file of files) {
        try {
          const mod = await import(join(localDir, file));
          const exported = mod.default;
          if (Array.isArray(exported)) {
            rules.push(...exported);
          } else if (exported && typeof exported === "object" && "id" in exported) {
            rules.push(exported);
          }
        } catch (err) {
          logger.warn(`Failed to load local rule ${file}:`, err);
        }
      }
    } catch {
    }
    return rules;
  }
  validateRule(rule) {
    if (!rule || typeof rule !== "object") return false;
    const r = rule;
    const required = [
      "id",
      "name",
      "category",
      "severity",
      "description",
      "rationale",
      "docs",
      "execute"
    ];
    for (const field of required) {
      if (!(field in r)) {
        logger.warn(`Rule missing required field "${field}" \u2014 skipping`);
        return false;
      }
    }
    if (typeof r.execute !== "function") {
      logger.warn(`Rule ${r.id}: "execute" must be a function \u2014 skipping`);
      return false;
    }
    return true;
  }
  checkDuplicateIds(rules) {
    const seen = /* @__PURE__ */ new Map();
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
};
var logger2 = createConsola({ level: 3 });
var RuleRunner = class {
  constructor(opts = {}) {
    this.opts = opts;
  }
  opts;
  async run(ctx, rules, relayVersion) {
    const startTime = Date.now();
    const applicable = this.filterRules(rules, ctx);
    const allFindings = [];
    let rulesTriggered = 0;
    for (const rule of applicable) {
      const effectiveSeverity = this.resolveOverride(rule.id, rule.severity);
      if (effectiveSeverity === "off") continue;
      try {
        const findings = await rule.execute(ctx);
        const stamped = findings.map((f) => ({
          ...f,
          severity: effectiveSeverity !== rule.severity ? effectiveSeverity : f.severity,
          ruleName: rule.name,
          docs: f.docs ?? rule.docs
        }));
        if (stamped.length > 0) rulesTriggered++;
        allFindings.push(...stamped);
      } catch (err) {
        logger2.warn(`Rule ${rule.id} threw an error:`, err);
        allFindings.push(this.makeErrorFinding(rule, err));
      }
    }
    const filtered = this.filterBySeverity(allFindings);
    const summary = this.buildSummary(filtered);
    const categoryScores = this.buildCategoryScores(filtered, applicable);
    const score = this.calculateScore(summary, categoryScores);
    const status = this.determineStatus(summary, score);
    return {
      version: relayVersion,
      timestamp: ctx.scannedAt,
      cwd: ctx.cwd,
      framework: ctx.framework,
      score,
      status,
      findings: filtered.sort(this.sortFindings),
      summary,
      categoryScores,
      rulesRun: applicable.length,
      rulesTriggered,
      durationMs: Date.now() - startTime
    };
  }
  filterRules(rules, ctx) {
    const { categories } = this.opts;
    return rules.filter((rule) => {
      if (categories && !categories.includes(rule.category)) return false;
      if (rule.frameworks && !rule.frameworks.some((fw) => ctx.allFrameworks.includes(fw))) {
        return false;
      }
      return true;
    });
  }
  resolveOverride(ruleId, defaultSeverity) {
    const override = this.opts.severityOverrides?.[ruleId];
    if (!override) return defaultSeverity;
    if (override === "off") return "off";
    if (override === "error") return "critical";
    if (override === "warn") return "medium";
    return override;
  }
  filterBySeverity(findings) {
    const min = this.opts.minSeverity ?? "info";
    const minOrder = SEVERITY_ORDER[min];
    return findings.filter((f) => SEVERITY_ORDER[f.severity] <= minOrder);
  }
  buildSummary(findings) {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
    for (const f of findings) {
      summary[f.severity]++;
      summary.total++;
    }
    return summary;
  }
  buildCategoryScores(findings, rules) {
    const categories = new Set(rules.map((r) => r.category));
    const scores = [];
    for (const category of categories) {
      const catFindings = findings.filter((f) => {
        const rule = rules.find((r) => r.id === f.ruleId);
        return rule?.category === category;
      });
      const deductions = catFindings.reduce((acc, f) => {
        const weights = {
          critical: 40,
          high: 20,
          medium: 10,
          low: 3,
          info: 0
        };
        return acc + (weights[f.severity] ?? 0);
      }, 0);
      const maxScore = 10;
      const score = Math.max(0, maxScore - deductions / 10);
      const status = score >= 8 ? "pass" : score >= 5 ? "warn" : "fail";
      scores.push({
        category,
        score: Math.round(score * 10) / 10,
        maxScore,
        findingCount: catFindings.length,
        status
      });
    }
    return scores.sort((a, b) => a.score - b.score);
  }
  calculateScore(summary, _categoryScores) {
    let score = 100;
    score -= summary.critical * 25;
    score -= summary.high * 10;
    score -= summary.medium * 4;
    score -= summary.low * 1;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  determineStatus(summary, score) {
    if (summary.critical > 0) return "critical";
    if (score < 50) return "hold";
    if (score < 75 || summary.high > 0) return "warn";
    return "ship";
  }
  sortFindings(a, b) {
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  }
  makeErrorFinding(rule, err) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: "info",
      category: rule.category,
      message: `Rule execution error: ${err instanceof Error ? err.message : String(err)}`,
      context: { error: true }
    };
  }
};
var RELAY_VERSION = true ? "0.1.0" : "0.0.0-dev";
var logger3 = createConsola({ level: 3 });
var RelayEngine = class {
  configLoader = new ConfigLoader();
  /**
   * Run a full project review.
   *
   * This is the primary method. CLI calls this. MCP server (V2) will call this.
   * Return value is always plain JSON — any reporter can render it.
   */
  async run(opts = {}) {
    const cwd = opts.cwd ?? process.cwd();
    const startTime = Date.now();
    logger3.debug(`RelayEngine.run() starting \u2014 cwd: ${cwd}`);
    const config = await this.configLoader.load(cwd, opts.config);
    const detection = await this.detect(
      cwd,
      opts.framework === "auto" ? void 0 : opts.framework
    );
    const framework = opts.framework && opts.framework !== "auto" ? opts.framework : detection.framework;
    logger3.debug(`Framework detected: ${framework} (confidence: ${detection.confidence})`);
    const contextBuilder = new ContextBuilder({
      cwd,
      framework,
      allFrameworks: detection.allFrameworks,
      relayVersion: RELAY_VERSION,
      ...opts.include !== void 0 ? { include: opts.include } : {},
      exclude: [...config.ignore ?? [], ...opts.exclude ?? []],
      meta: config
    });
    const ctx = await contextBuilder.build();
    logger3.debug(`Context built: ${ctx.sourceFiles.length} files collected`);
    const registry = new PluginRegistry(cwd);
    const allRules = await registry.discover(config.plugins);
    logger3.debug(`Rules loaded: ${allRules.length}`);
    const runner = new RuleRunner({
      minSeverity: opts.severity ?? config.severity,
      ...opts.categories !== void 0 ? { categories: opts.categories } : {},
      severityOverrides: config.rules
    });
    const result = await runner.run(ctx, allRules, RELAY_VERSION);
    logger3.debug(
      `Review complete in ${Date.now() - startTime}ms \u2014 score: ${result.score}/100 (${result.status})`
    );
    return result;
  }
  /**
   * Detect the framework used by a project.
   *
   * Useful for MCP tool: relay_detect
   * Also called internally by run().
   */
  async detect(cwd, frameworkOverride) {
    const projectCwd = cwd ?? process.cwd();
    if (frameworkOverride && frameworkOverride !== "auto") {
      return {
        framework: frameworkOverride,
        allFrameworks: [frameworkOverride],
        confidence: "high",
        evidence: ["User override via config/CLI"]
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
  async validate(config) {
    try {
      await this.configLoader.load(process.cwd(), config);
      return { valid: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { valid: false, errors: [message] };
    }
  }
  /**
   * Get the current Relay version.
   */
  get version() {
    return RELAY_VERSION;
  }
};

// src/commands/doctor.ts
import { defineCommand } from "citty";
import { createConsola as createConsola2 } from "consola";
var logger4 = createConsola2({ level: 4 });
var doctorCommand = defineCommand({
  meta: {
    name: "doctor",
    description: "Diagnose your Relay installation and project configuration"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    }
  },
  async run({ args }) {
    const cwd = args.cwd;
    let allPassed = true;
    console.log("\n  Relay Doctor\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
    const nodeVer = process.version;
    const nodeMajor = Number.parseInt(nodeVer.slice(1));
    if (nodeMajor >= 18) {
      logger4.success(`Node ${nodeVer} detected (minimum: 18)`);
    } else {
      logger4.error(`Node ${nodeVer} \u2014 upgrade to 18+ required`);
      allPassed = false;
    }
    const engine = new RelayEngine();
    logger4.success(`@relay/cli ${engine.version}`);
    const configFiles = [".relayrc.json", "relay.config.ts", "relay.config.js"];
    const foundConfig = configFiles.find((f) => existsSync2(join2(cwd, f)));
    if (foundConfig) {
      logger4.success(`Config found: ${foundConfig}`);
      const validation = await engine.validate(null);
      if (validation.valid) {
        logger4.success("Config is valid");
      } else {
        logger4.error(`Config invalid:
${validation.errors.join("\n")}`);
        allPassed = false;
      }
    } else {
      logger4.warn("No config file found \u2014 using defaults");
      logger4.info("Run `relay init` to create one");
    }
    const detection = await engine.detect(cwd);
    if (detection.framework !== "unknown") {
      logger4.success(
        `Framework detected: ${detection.framework} (${detection.confidence} confidence)`
      );
    } else {
      logger4.warn("Framework not detected \u2014 may affect rule loading");
    }
    const lockfiles = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
    const foundLock = lockfiles.find((f) => existsSync2(join2(cwd, f)));
    if (foundLock) {
      logger4.success(`Lockfile found: ${foundLock}`);
    } else {
      logger4.warn("No lockfile found \u2014 consider committing one");
    }
    if (existsSync2(join2(cwd, ".git"))) {
      logger4.success("Git repository detected");
    } else {
      logger4.warn("Not a git repository");
    }
    console.log("");
    if (allPassed) {
      logger4.success("All checks passed \u2014 ready to run `relay review`\n");
    } else {
      logger4.error("Some checks failed \u2014 fix the issues above\n");
      process.exit(1);
    }
  }
});

// src/commands/init.ts
import { existsSync as existsSync3, writeFileSync } from "fs";
import { join as join3 } from "path";
import { defineCommand as defineCommand2 } from "citty";
import { createConsola as createConsola3 } from "consola";
var logger5 = createConsola3({ level: 4 });
var DEFAULT_CONFIG = {
  $schema: "https://relay.dev/schema/config.json",
  framework: "auto",
  severity: "info",
  rules: {},
  plugins: [],
  ignore: ["dist/**", "build/**", "node_modules/**", "coverage/**"],
  report: {
    format: "terminal"
  },
  thresholds: {
    score: 0,
    critical: 0
  }
};
var initCommand = defineCommand2({
  meta: {
    name: "init",
    description: "Initialize Relay in the current project"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    },
    force: {
      type: "boolean",
      description: "Overwrite existing config",
      default: false
    }
  },
  async run({ args }) {
    const cwd = args.cwd;
    const configPath = join3(cwd, ".relayrc.json");
    console.log("\n  Relay Init\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
    if (existsSync3(configPath) && !args.force) {
      logger5.warn(".relayrc.json already exists. Use --force to overwrite.");
      return;
    }
    writeFileSync(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}
`, "utf8");
    logger5.success("Created .relayrc.json");
    console.log("\n  Next steps:\n");
    console.log("    1. Review .relayrc.json and adjust thresholds");
    console.log("    2. Install rule packs:");
    console.log("       pnpm add -D @relay/rules-security @relay/rules-accessibility");
    console.log("    3. Run your first review:");
    console.log("       relay review");
    console.log("");
  }
});

// src/commands/install-skills.ts
import { existsSync as existsSync4, mkdirSync, readFileSync as readFileSync2, readdirSync as readdirSync2, writeFileSync as writeFileSync2 } from "fs";
import { homedir } from "os";
import { dirname, join as join4 } from "path";
import { fileURLToPath } from "url";
import { defineCommand as defineCommand3 } from "citty";
import { createConsola as createConsola4 } from "consola";
var logger6 = createConsola4({ level: 4 });
async function runInstallSkills(args) {
  const cwd = args.cwd;
  const providerList = args.providers.split(",").map((p) => p.trim().toLowerCase());
  const isAll = providerList.includes("all");
  console.log("\n  Relay Skill Installer\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const searchPaths = [
    join4(currentFileDir, "skills"),
    // dist output
    join4(currentFileDir, "../../skills"),
    // local dev from packages/cli/src/
    join4(currentFileDir, "../../../../skills"),
    // local dev/test from packages/cli/src/commands/
    join4(cwd, "skills"),
    // local dev fallback from cwd
    join4(cwd, "packages/cli/dist/skills")
    // monorepo root pointing to dist
  ];
  let sourceSkillsDir = "";
  for (const p of searchPaths) {
    if (existsSync4(p)) {
      sourceSkillsDir = p;
      break;
    }
  }
  if (!sourceSkillsDir) {
    logger6.error("Could not locate the Relay skills source directory.");
    process.exit(1);
  }
  logger6.info(`Source skills directory: ${sourceSkillsDir}`);
  const skillsList = [];
  try {
    const entries = readdirSync2(sourceSkillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFilePath = join4(sourceSkillsDir, entry.name, "SKILL.md");
        if (existsSync4(skillFilePath)) {
          const content = readFileSync2(skillFilePath, "utf8");
          skillsList.push({ name: entry.name, content });
        }
      }
    }
  } catch (err) {
    logger6.error("Failed to read source skills directory:", err);
    process.exit(1);
  }
  if (skillsList.length === 0) {
    logger6.warn("No skills found to install.");
    return;
  }
  logger6.success(
    `Discovered ${skillsList.length} skills: ${skillsList.map((s) => s.name).join(", ")}`
  );
  const safeWriteFile = (dir, filename, content) => {
    try {
      if (!existsSync4(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const filePath = join4(dir, filename);
      writeFileSync2(filePath, content, "utf8");
      logger6.success(`Installed: ${join4(dir, filename)}`);
    } catch (err) {
      logger6.error(`Failed to write file in ${dir}:`, err);
    }
  };
  if (isAll || providerList.includes("cursor")) {
    const cursorDir = join4(cwd, ".cursor", "rules");
    logger6.info("Installing Cursor rules...");
    for (const skill of skillsList) {
      safeWriteFile(cursorDir, `relay-${skill.name}.md`, skill.content);
    }
  }
  if (isAll || providerList.includes("claude")) {
    if (args.global) {
      const globalClaudeDir = join4(homedir(), ".claude", "skills");
      logger6.info("Installing Claude Code skills globally...");
      for (const skill of skillsList) {
        safeWriteFile(globalClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
    } else {
      const localClaudeDir = join4(cwd, ".claude", "skills");
      logger6.info("Installing Claude Code skills locally...");
      for (const skill of skillsList) {
        safeWriteFile(localClaudeDir, `relay-${skill.name}.md`, skill.content);
      }
      const claudeCommandsDir = join4(cwd, ".claude", "commands");
      logger6.info("Installing Claude Code slash commands...");
      for (const skill of skillsList) {
        let cleanContent = skill.content;
        if (cleanContent.startsWith("---")) {
          const parts = cleanContent.split("---");
          if (parts.length >= 3) {
            cleanContent = parts.slice(2).join("---").trim();
          }
        }
        safeWriteFile(claudeCommandsDir, `relay-${skill.name}.md`, cleanContent);
      }
    }
  }
  if (isAll || providerList.includes("agents")) {
    const agentsDir = join4(cwd, ".agents", "skills");
    logger6.info("Installing general agent skills...");
    for (const skill of skillsList) {
      safeWriteFile(agentsDir, `relay-${skill.name}.md`, skill.content);
    }
  }
  if (isAll || providerList.includes("copilot")) {
    const githubDir = join4(cwd, ".github");
    const copilotFile = join4(githubDir, "copilot-instructions.md");
    logger6.info("Installing Copilot instructions...");
    const separatorBegin = "<!-- BEGIN RELAY SKILLS -->";
    const separatorEnd = "<!-- END RELAY SKILLS -->";
    let combinedContent = `${separatorBegin}
# Relay Assistant Skills

`;
    for (const skill of skillsList) {
      let cleanContent = skill.content;
      if (cleanContent.startsWith("---")) {
        const parts = cleanContent.split("---");
        if (parts.length >= 3) {
          cleanContent = parts.slice(2).join("---").trim();
        }
      }
      combinedContent += `## Skill: ${skill.name}

${cleanContent}

`;
    }
    combinedContent += `${separatorEnd}`;
    try {
      if (!existsSync4(githubDir)) {
        mkdirSync(githubDir, { recursive: true });
      }
      let finalFileContent = combinedContent;
      if (existsSync4(copilotFile)) {
        const existingContent = readFileSync2(copilotFile, "utf8");
        const beginIdx = existingContent.indexOf(separatorBegin);
        const endIdx = existingContent.indexOf(separatorEnd);
        if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
          finalFileContent = existingContent.slice(0, beginIdx) + combinedContent + existingContent.slice(endIdx + separatorEnd.length);
        } else {
          finalFileContent = `${existingContent.trim()}

${combinedContent}
`;
        }
      }
      writeFileSync2(copilotFile, finalFileContent, "utf8");
      logger6.success(`Installed: ${copilotFile}`);
    } catch (err) {
      logger6.error("Failed to write Copilot instructions:", err);
    }
  }
  console.log("\n  Relay Skill Installation Complete!\n");
}
var installSkillsCommand = defineCommand3({
  meta: {
    name: "install-skills",
    description: "Automatically install Relay agent skills into AI assistant configuration directories"
  },
  args: {
    cwd: {
      type: "string",
      description: "Project root directory",
      default: process.cwd()
    },
    providers: {
      type: "string",
      description: "Comma-separated assistant providers to install for (cursor, claude, copilot, agents, all)",
      default: "all"
    },
    global: {
      type: "boolean",
      description: "Install Claude skills globally (~/.claude/skills)",
      default: false
    }
  },
  async run({ args }) {
    await runInstallSkills(args);
  }
});

// src/commands/misc.ts
import { defineCommand as defineCommand4 } from "citty";

// src/shared-args.ts
var sharedReviewArgs = {
  cwd: {
    type: "string",
    description: "Project root directory (default: current directory)",
    default: process.cwd(),
    alias: "C"
  },
  format: {
    type: "string",
    description: "Output format: terminal | json | markdown | html | sarif | github",
    default: "terminal",
    alias: "f"
  },
  output: {
    type: "string",
    description: "Write report to file",
    alias: "o"
  },
  framework: {
    type: "string",
    description: "Force framework detection result"
  },
  severity: {
    type: "string",
    description: "Minimum severity: critical | high | medium | low | info",
    default: "info",
    alias: "s"
  },
  ci: {
    type: "boolean",
    description: "CI mode: no color, machine-friendly output",
    default: false
  },
  verbose: {
    type: "boolean",
    description: "Verbose debug output",
    default: false,
    alias: "v"
  },
  config: {
    type: "string",
    description: "Config file path (default: auto-detect)"
  }
};
function toRunOptions(args, categories) {
  const opts = {
    cwd: args.cwd,
    severity: args.severity
  };
  if (args.framework !== void 0) {
    opts.framework = args.framework;
  }
  if (categories !== void 0) {
    opts.categories = categories;
  }
  return opts;
}
function toExitCode(status) {
  switch (status) {
    case "ship":
      return 0;
    case "warn":
      return 1;
    case "hold":
      return 2;
    case "critical":
      return 3;
    default:
      return 2;
  }
}

// src/commands/misc.ts
var accessibilityCommand = defineCommand4({
  meta: { name: "accessibility", description: "Accessibility review (WCAG 2.1)" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ["accessibility"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var architectureCommand = defineCommand4({
  meta: { name: "architecture", description: "Architecture review \u2014 coupling, patterns, deps" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ["architecture"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var performanceCommand = defineCommand4({
  meta: { name: "performance", description: "Performance review \u2014 bundle, rendering, caching" },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const result = await engine.run(toRunOptions(args, ["performance"]));
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});
var reportCommand = defineCommand4({
  meta: { name: "report", description: "Re-render a saved scan result in a different format" },
  args: {
    input: {
      type: "string",
      description: "Path to saved JSON scan result",
      required: true
    },
    format: {
      type: "string",
      description: "Output format: terminal | json | markdown | html | sarif | github",
      default: "terminal"
    },
    output: {
      type: "string",
      description: "Write to file"
    }
  },
  async run({ args }) {
    const { readFileSync: readFileSync3 } = await import("fs");
    const { renderResult: renderResult2 } = await import("./render-3RLZNMUI.js");
    const raw = readFileSync3(args.input, "utf8");
    const result = JSON.parse(raw);
    await renderResult2(result, {
      format: args.format,
      output: args.output,
      ci: false,
      verbose: false
    });
  }
});
var versionCommand = defineCommand4({
  meta: { name: "version", description: "Show Relay version information" },
  args: {},
  run() {
    const engine = new RelayEngine();
    console.log(`relay ${engine.version}`);
  }
});

// src/commands/release.ts
import { defineCommand as defineCommand5 } from "citty";
var releaseCommand = defineCommand5({
  meta: {
    name: "release",
    description: "Release readiness gate \u2014 tests, changelog, version, deps"
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args, ["testing", "deployment", "security", "documentation"]);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/commands/review.ts
import { defineCommand as defineCommand6 } from "citty";
var reviewCommand = defineCommand6({
  meta: {
    name: "review",
    description: "Run a full project review across all categories"
  },
  args: {
    ...sharedReviewArgs
  },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/commands/security.ts
import { defineCommand as defineCommand7 } from "citty";
var securityCommand = defineCommand7({
  meta: {
    name: "security",
    description: "Run a security-focused review (OWASP Top 10, secrets, headers)"
  },
  args: { ...sharedReviewArgs },
  async run({ args }) {
    const engine = new RelayEngine();
    const opts = toRunOptions(args, ["security"]);
    const result = await engine.run(opts);
    await renderResult(result, args);
    process.exit(toExitCode(result.status));
  }
});

// src/cli.ts
var main = defineCommand8({
  meta: {
    name: "relay",
    version: "0.1.0",
    description: "Developer review platform \u2014 QA, security, release, architecture"
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
    "install-skills": installSkillsCommand,
    version: versionCommand
  }
});
runMain(main);
//# sourceMappingURL=cli.js.map