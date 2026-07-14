/**
 * @relay/shared
 * Core types, enums, and interfaces shared across the entire Relay platform.
 * Zero runtime dependencies. This package is types-only.
 */

// ─── Severity ────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
} as const;

// ─── Categories ──────────────────────────────────────────────────────────────

export type RuleCategory =
  | 'security'
  | 'accessibility'
  | 'performance'
  | 'architecture'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'repository';

// ─── Frameworks ──────────────────────────────────────────────────────────────

export type Framework =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'angular'
  | 'svelte'
  | 'sveltekit'
  | 'astro'
  | 'remix'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'hono'
  | 'fastapi'
  | 'django'
  | 'flask'
  | 'laravel'
  | 'rails'
  | 'unknown';

// ─── Review Status ───────────────────────────────────────────────────────────

export type ReviewStatus = 'ship' | 'warn' | 'hold' | 'critical';

// ─── Source File ─────────────────────────────────────────────────────────────

export interface SourceFile {
  /** Absolute path to the file */
  path: string;
  /** Path relative to project root */
  relativePath: string;
  /** File extension without leading dot */
  extension: string;
  /** Raw file content */
  content: string;
  /** Lines array for O(1) line lookup */
  lines: string[];
  /** File size in bytes */
  sizeBytes: number;
}

// ─── Git Info ────────────────────────────────────────────────────────────────

export interface GitInfo {
  /** Current branch name */
  branch: string | null;
  /** Latest commit hash (short) */
  commitHash: string | null;
  /** Latest commit message */
  commitMessage: string | null;
  /** Latest commit author */
  commitAuthor: string | null;
  /** ISO timestamp of latest commit */
  commitDate: string | null;
  /** Number of uncommitted changes */
  uncommittedChanges: number;
  /** Whether the repo has a remote */
  hasRemote: boolean;
  /** Remote URL (sanitized, no tokens) */
  remoteUrl: string | null;
}

// ─── Dependency Info ─────────────────────────────────────────────────────────

export interface DependencyInfo {
  name: string;
  version: string;
  isDev: boolean;
  isPeer: boolean;
  /** Resolved version from lockfile, if available */
  resolvedVersion?: string;
}

// ─── Project Context ─────────────────────────────────────────────────────────

/**
 * ProjectContext is the complete picture of a project at scan time.
 * It is the sole input to all rule execution functions.
 * Rules must not perform their own FS reads — all data comes from here.
 */
export interface ProjectContext {
  /** Absolute path to project root */
  cwd: string;
  /** Detected primary framework */
  framework: Framework;
  /** All detected frameworks (may include secondary ones, e.g. react + nextjs) */
  allFrameworks: Framework[];
  /** Raw package.json content, if present */
  packageJson: Record<string, unknown> | null;
  /** All production + dev dependencies */
  dependencies: DependencyInfo[];
  /** Source files collected for analysis */
  sourceFiles: SourceFile[];
  /** Config files found at project root */
  configFiles: string[];
  /** Git repository information */
  git: GitInfo | null;
  /** Whether a lockfile was found */
  hasLockfile: boolean;
  /** Detected package manager */
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown';
  /** Scan timestamp (ISO 8601) */
  scannedAt: string;
  /** Relay version used for this scan */
  relayVersion: string;
  /** User-provided metadata (from .relayrc.json) */
  meta: Record<string, unknown>;
}

// ─── Finding ─────────────────────────────────────────────────────────────────

export interface Finding {
  /** Rule that produced this finding */
  ruleId: string;
  /** Rule name for human display */
  ruleName?: string;
  /** Finding severity */
  severity: Severity;
  /** Rule category */
  category: RuleCategory;
  /** Human-readable description of the specific issue */
  message: string;
  /** File where the issue was found (relative path) */
  file?: string;
  /** Line number (1-indexed) */
  line?: number;
  /** Column number (1-indexed) */
  column?: number;
  /** Snippet of problematic code or content */
  evidence?: string;
  /** Suggested fix (text only — never applied automatically) */
  suggestion?: string;
  /** Link to documentation */
  docs?: string;
  /** Additional structured context for reporters */
  context?: Record<string, unknown>;
}

// ─── Fix Suggestion ──────────────────────────────────────────────────────────

/**
 * V1: Suggestions are text/diff only. Never applied automatically.
 * V3: relay fix --confirm will apply suggestions with explicit approval.
 */
export interface FixSuggestion {
  /** Human-readable description of what to change */
  description: string;
  /** Unified diff format (optional, for display only in V1) */
  diff?: string;
  /** CLI command to run as part of the fix */
  command?: string;
  /** Link to documentation */
  docs?: string;
}

// ─── Rule ────────────────────────────────────────────────────────────────────

export interface Rule {
  /** Unique rule identifier — format: CAT-NNN (e.g. SEC-001) */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Rule category */
  category: RuleCategory;
  /** Default severity (can be overridden in .relayrc.json) */
  severity: Severity;
  /**
   * Which frameworks this rule applies to.
   * undefined = applies to all frameworks.
   */
  frameworks?: Framework[];
  /** Optional tags for filtering */
  tags?: string[];
  /** Short description of what this rule checks */
  description: string;
  /** Why this rule matters — shown in reports */
  rationale: string;
  /** URL to full rule documentation */
  docs: string;
  /**
   * Execute the rule against the project context.
   * Must not throw — return [] on no findings.
   * Must not modify any files.
   */
  execute(ctx: ProjectContext): Finding[] | Promise<Finding[]>;
  /**
   * Generate a fix suggestion for a specific finding.
   * V1: display only. V3: will be applied with --confirm.
   */
  fix?: (finding: Finding) => FixSuggestion;
}

// ─── Rule Pack ───────────────────────────────────────────────────────────────

export interface RulePack {
  /** npm package name */
  name: string;
  /** Semver version */
  version: string;
  /** Frameworks this pack targets (undefined = all) */
  frameworks?: Framework[];
  /** Rules in this pack */
  rules: Rule[];
  /** Optional pack-level docs URL */
  docs?: string;
}

// ─── Review Result ───────────────────────────────────────────────────────────

export interface CategoryScore {
  category: RuleCategory;
  score: number;
  maxScore: number;
  findingCount: number;
  status: 'pass' | 'warn' | 'fail';
}

export interface FindingSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface ReviewResult {
  /** Relay version */
  version: string;
  /** Scan timestamp (ISO 8601) */
  timestamp: string;
  /** Project root directory */
  cwd: string;
  /** Detected framework */
  framework: Framework;
  /** Overall score 0–100 */
  score: number;
  /** Overall ship/hold decision */
  status: ReviewStatus;
  /** All findings from rule execution */
  findings: Finding[];
  /** Summary counts by severity */
  summary: FindingSummary;
  /** Per-category scores */
  categoryScores: CategoryScore[];
  /** Rules that were executed */
  rulesRun: number;
  /** Rules that produced findings */
  rulesTriggered: number;
  /** Scan duration in milliseconds */
  durationMs: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export type SeverityOverride = Severity | 'error' | 'warn' | 'off';

export interface RelayConfig {
  /** Framework override (default: 'auto') */
  framework?: Framework | 'auto';
  /** Minimum severity to report (default: 'info') */
  severity?: Severity;
  /** Per-rule severity overrides */
  rules?: Record<string, SeverityOverride>;
  /** Installed rule pack names or local paths */
  plugins?: string[];
  /** Glob patterns to exclude from scanning */
  ignore?: string[];
  /** Report output configuration */
  report?: {
    format?: 'terminal' | 'json' | 'markdown' | 'html' | 'sarif' | 'github';
    output?: string;
  };
  /** Thresholds for CI pass/fail */
  thresholds?: {
    /** Minimum overall score (0–100) */
    score?: number;
    /** Maximum allowed critical findings */
    critical?: number;
    /** Maximum allowed high findings */
    high?: number;
  };
}

// ─── Run Options ─────────────────────────────────────────────────────────────

/**
 * Options passed to RelayEngine.run().
 * This is the only interface that CLI, MCP server, and future transports use.
 * Transport layer must translate its own args/params into RunOptions.
 */
export interface RunOptions {
  /** Project root to scan (default: process.cwd()) */
  cwd?: string;
  /** Categories to include (default: all) */
  categories?: RuleCategory[];
  /** Minimum severity to include in results (default: 'info') */
  severity?: Severity;
  /** Config override (merged with .relayrc.json) */
  config?: Partial<RelayConfig>;
  /** Force framework detection result */
  framework?: Framework | 'auto';
  /** Additional file patterns to include */
  include?: string[];
  /** Additional file patterns to exclude */
  exclude?: string[];
}

// ─── Reporter ────────────────────────────────────────────────────────────────

export interface Reporter {
  name: string;
  render(result: ReviewResult, options?: ReporterOptions): string | Promise<string>;
}

export interface ReporterOptions {
  /** Whether to use color (default: true if TTY) */
  color?: boolean;
  /** Minimum severity to show in output */
  severity?: Severity;
  /** Whether this is CI mode (compact, no interactive elements) */
  ci?: boolean;
}

// ─── Detection Result ────────────────────────────────────────────────────────

export interface DetectionResult {
  framework: Framework;
  allFrameworks: Framework[];
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

// ─── Utility Types ───────────────────────────────────────────────────────────

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Deep readonly */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
