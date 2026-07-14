import type {
  CategoryScore,
  Finding,
  FindingSummary,
  ProjectContext,
  ReviewResult,
  ReviewStatus,
  Rule,
  RuleCategory,
  Severity,
  SeverityOverride,
} from '@relay/shared';
import { SEVERITY_ORDER } from '@relay/shared';
import { createConsola } from 'consola';

const logger = createConsola({ level: 3 });

export interface RuleRunnerOptions {
  /** Minimum severity to include in output */
  minSeverity?: Severity;
  /** Categories to run (undefined = all) */
  categories?: RuleCategory[];
  /** Per-rule severity overrides from config */
  severityOverrides?: Record<string, SeverityOverride>;
}

export class RuleRunner {
  constructor(private readonly opts: RuleRunnerOptions = {}) {}

  async run(ctx: ProjectContext, rules: Rule[], relayVersion: string): Promise<ReviewResult> {
    const startTime = Date.now();
    const applicable = this.filterRules(rules, ctx);
    const allFindings: Finding[] = [];
    let rulesTriggered = 0;

    for (const rule of applicable) {
      // Apply severity override from config
      const effectiveSeverity = this.resolveOverride(rule.id, rule.severity);
      if (effectiveSeverity === 'off') continue;

      try {
        const findings = await rule.execute(ctx);

        // Re-stamp with effective severity if overridden
        const stamped = findings.map((f) => ({
          ...f,
          severity:
            effectiveSeverity !== rule.severity ? (effectiveSeverity as Severity) : f.severity,
          ruleName: rule.name,
          docs: f.docs ?? rule.docs,
        }));

        if (stamped.length > 0) rulesTriggered++;
        allFindings.push(...stamped);
      } catch (err) {
        // Rule crash = internal error finding, never halts the scan
        logger.warn(`Rule ${rule.id} threw an error:`, err);
        allFindings.push(this.makeErrorFinding(rule, err));
      }
    }

    // Filter by minimum severity
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
      durationMs: Date.now() - startTime,
    };
  }

  private filterRules(rules: Rule[], ctx: ProjectContext): Rule[] {
    const { categories } = this.opts;

    return rules.filter((rule) => {
      // Category filter
      if (categories && !categories.includes(rule.category)) return false;
      // Framework filter
      if (rule.frameworks && !rule.frameworks.some((fw) => ctx.allFrameworks.includes(fw))) {
        return false;
      }
      return true;
    });
  }

  private resolveOverride(ruleId: string, defaultSeverity: Severity): Severity | 'off' {
    const override = this.opts.severityOverrides?.[ruleId];
    if (!override) return defaultSeverity;

    if (override === 'off') return 'off';
    if (override === 'error') return 'critical';
    if (override === 'warn') return 'medium';
    return override;
  }

  private filterBySeverity(findings: Finding[]): Finding[] {
    const min = this.opts.minSeverity ?? 'info';
    const minOrder = SEVERITY_ORDER[min];
    return findings.filter((f) => SEVERITY_ORDER[f.severity] <= minOrder);
  }

  private buildSummary(findings: Finding[]): FindingSummary {
    const summary: FindingSummary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
    for (const f of findings) {
      summary[f.severity]++;
      summary.total++;
    }
    return summary;
  }

  private buildCategoryScores(findings: Finding[], rules: Rule[]): CategoryScore[] {
    const categories = new Set(rules.map((r) => r.category));
    const scores: CategoryScore[] = [];

    for (const category of categories) {
      const catFindings = findings.filter((f) => {
        const rule = rules.find((r) => r.id === f.ruleId);
        return rule?.category === category;
      });

      const deductions = catFindings.reduce((acc, f) => {
        const weights: Record<Severity, number> = {
          critical: 40,
          high: 20,
          medium: 10,
          low: 3,
          info: 0,
        };
        return acc + (weights[f.severity] ?? 0);
      }, 0);

      const maxScore = 10;
      const score = Math.max(0, maxScore - deductions / 10);
      const status = score >= 8 ? 'pass' : score >= 5 ? 'warn' : 'fail';

      scores.push({
        category,
        score: Math.round(score * 10) / 10,
        maxScore,
        findingCount: catFindings.length,
        status,
      });
    }

    return scores.sort((a, b) => a.score - b.score);
  }

  private calculateScore(summary: FindingSummary, _categoryScores: CategoryScore[]): number {
    // Start at 100, deduct based on severity
    let score = 100;
    score -= summary.critical * 25;
    score -= summary.high * 10;
    score -= summary.medium * 4;
    score -= summary.low * 1;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineStatus(summary: FindingSummary, score: number): ReviewStatus {
    if (summary.critical > 0) return 'critical';
    if (score < 50) return 'hold';
    if (score < 75 || summary.high > 0) return 'warn';
    return 'ship';
  }

  private sortFindings(a: Finding, b: Finding): number {
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  }

  private makeErrorFinding(rule: Rule, err: unknown): Finding {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: 'info',
      category: rule.category,
      message: `Rule execution error: ${err instanceof Error ? err.message : String(err)}`,
      context: { error: true },
    };
  }
}
