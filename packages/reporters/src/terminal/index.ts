import type { Reporter, ReporterOptions, ReviewResult, Severity } from '@relay/shared';
import { SEVERITY_ORDER } from '@relay/shared';
import boxen from 'boxen';
import chalk from 'chalk';
import Table from 'cli-table3';

const STATUS_ICONS: Record<string, string> = {
  ship: '✅',
  warn: '⚠️ ',
  hold: '❌',
  critical: '🚨',
};

const STATUS_LABELS: Record<string, string> = {
  ship: 'SHIP',
  warn: 'WARN',
  hold: 'HOLD',
  critical: 'CRITICAL — DO NOT SHIP',
};

const SEVERITY_COLORS: Record<Severity, (s: string) => string> = {
  critical: chalk.bgRed.white.bold,
  high: chalk.red.bold,
  medium: chalk.yellow.bold,
  low: chalk.cyan,
  info: chalk.gray,
};

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: chalk.bgRed.white.bold(' CRITICAL '),
  high: chalk.bgYellow.black.bold('   HIGH   '),
  medium: chalk.bgBlue.white('  MEDIUM  '),
  low: chalk.bgGray.white('   LOW    '),
  info: chalk.gray('   INFO   '),
};

export class TerminalReporter implements Reporter {
  name = 'terminal';

  render(result: ReviewResult, opts: ReporterOptions = {}): string {
    const useColor = opts.color ?? process.stdout.isTTY;
    if (!useColor) chalk.level = 0;

    const lines: string[] = [];

    // ── Header ──────────────────────────────────────────────────────────────

    const statusIcon = STATUS_ICONS[result.status] ?? '?';
    const statusLabel = STATUS_LABELS[result.status] ?? result.status.toUpperCase();
    const scoreColor =
      result.score >= 80 ? chalk.green : result.score >= 60 ? chalk.yellow : chalk.red;

    const header = boxen(
      [
        chalk.bold.white('RELAY REVIEW REPORT'),
        '',
        chalk.gray(
          `Framework: ${result.framework}  •  ${new Date(result.timestamp).toLocaleString()}`
        ),
        '',
        `${scoreColor.bold(`Score: ${result.score}/100`)}   ${statusIcon}  ${chalk.bold(statusLabel)}`,
        '',
        chalk.gray(`${result.rulesRun} rules checked in ${result.durationMs}ms`),
      ].join('\n'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor:
          result.status === 'ship'
            ? 'green'
            : result.status === 'warn'
              ? 'yellow'
              : result.status === 'hold'
                ? 'red'
                : 'redBright',
        textAlignment: 'center',
      }
    );

    lines.push('', header, '');

    // ── Category scores table ────────────────────────────────────────────────

    if (result.categoryScores.length > 0) {
      const table = new Table({
        head: [
          chalk.bold('Category'),
          chalk.bold('Score'),
          chalk.bold('Findings'),
          chalk.bold('Status'),
        ],
        style: { head: [], border: ['gray'] },
        colWidths: [18, 10, 12, 12],
      });

      for (const cat of result.categoryScores) {
        const statusIcon =
          cat.status === 'pass'
            ? chalk.green('✓')
            : cat.status === 'warn'
              ? chalk.yellow('⚠')
              : chalk.red('✗');
        const scoreStr =
          cat.status === 'pass'
            ? chalk.green(`${cat.score}/${cat.maxScore}`)
            : cat.status === 'warn'
              ? chalk.yellow(`${cat.score}/${cat.maxScore}`)
              : chalk.red(`${cat.score}/${cat.maxScore}`);

        table.push([
          cat.category,
          scoreStr,
          String(cat.findingCount),
          `${statusIcon} ${cat.status}`,
        ]);
      }

      lines.push(table.toString(), '');
    }

    // ── Findings grouped by severity ─────────────────────────────────────────

    const minSeverity = opts.severity ?? 'info';
    const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const filteredSeverities = severities.filter(
      (s) => SEVERITY_ORDER[s] <= SEVERITY_ORDER[minSeverity]
    );

    for (const severity of filteredSeverities) {
      const findings = result.findings.filter((f) => f.severity === severity);
      if (findings.length === 0) continue;

      lines.push(
        chalk.bold(
          `${SEVERITY_BADGE[severity]}  ${findings.length} finding${findings.length > 1 ? 's' : ''}`
        )
      );
      lines.push(chalk.gray('─'.repeat(72)));

      for (const finding of findings) {
        lines.push('');
        lines.push(
          `  ${SEVERITY_COLORS[finding.severity](finding.ruleId)}  ${chalk.white.bold(finding.message)}`
        );

        if (finding.file) {
          const loc = finding.line ? `${finding.file}:${finding.line}` : finding.file;
          lines.push(`  ${chalk.gray('↳')} ${chalk.underline.cyan(loc)}`);
        }

        if (finding.evidence) {
          lines.push(`  ${chalk.gray('Evidence:')} ${chalk.italic(finding.evidence)}`);
        }

        if (finding.suggestion) {
          lines.push(`  ${chalk.green('→')} ${chalk.dim(finding.suggestion)}`);
        }

        if (finding.docs) {
          lines.push(`  ${chalk.gray('Docs:')} ${chalk.dim.underline(finding.docs)}`);
        }
      }

      lines.push('');
    }

    // ── Summary ──────────────────────────────────────────────────────────────

    const s = result.summary;
    lines.push(chalk.gray('─'.repeat(72)));
    lines.push(
      `  ${[
        s.critical > 0 ? chalk.bgRed.white.bold(` ${s.critical} critical `) : null,
        s.high > 0 ? chalk.red.bold(`${s.high} high`) : null,
        s.medium > 0 ? chalk.yellow(`${s.medium} medium`) : null,
        s.low > 0 ? chalk.cyan(`${s.low} low`) : null,
        s.info > 0 ? chalk.gray(`${s.info} info`) : null,
        chalk.gray(`${s.total} total`),
      ]
        .filter(Boolean)
        .join(chalk.gray('  ·  '))}`
    );
    lines.push('');

    // ── Final decision ───────────────────────────────────────────────────────

    const decisionBox = boxen(
      result.status === 'ship'
        ? chalk.green.bold('✅  SHIP — All checks passed')
        : result.status === 'warn'
          ? chalk.yellow.bold('⚠️   WARN — Review findings before shipping')
          : result.status === 'hold'
            ? chalk.red.bold('❌  HOLD — Fix blocking issues before shipping')
            : chalk.redBright.bold('🚨  CRITICAL — Do not ship. Fix immediately.'),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        borderStyle: 'round',
        borderColor:
          result.status === 'ship' ? 'green' : result.status === 'warn' ? 'yellow' : 'red',
      }
    );

    lines.push(decisionBox, '');

    return lines.join('\n');
  }
}
