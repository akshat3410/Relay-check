import type { Reporter, ReviewResult, Severity } from '@relay/shared';

const SEVERITY_MAP: Record<Severity, 'error' | 'warning' | 'note'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'note',
  info: 'note',
};

export class SarifReporter implements Reporter {
  name = 'sarif';

  render(result: ReviewResult): string {
    const rulesMap = new Map<string, { id: string; name: string; shortDescription: { text: string } }>();

    // Collect all unique rules that were triggered
    for (const finding of result.findings) {
      if (!rulesMap.has(finding.ruleId)) {
        rulesMap.set(finding.ruleId, {
          id: finding.ruleId,
          name: finding.ruleName ?? finding.ruleId,
          shortDescription: {
            text: finding.message,
          },
        });
      }
    }

    const sarifRun = {
      tool: {
        driver: {
          name: 'Relay',
          version: result.version,
          informationUri: 'https://relay.dev',
          rules: Array.from(rulesMap.values()),
        },
      },
      results: result.findings.map((finding) => {
        const sarifResult: Record<string, unknown> = {
          ruleId: finding.ruleId,
          level: SEVERITY_MAP[finding.severity],
          message: {
            text: finding.message,
          },
        };

        if (finding.file) {
          sarifResult.locations = [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.file,
                  uriBaseId: '%SRCROOT%',
                },
                region: {
                  startLine: finding.line ?? 1,
                  startColumn: finding.column ?? 1,
                },
              },
            },
          ];
        }

        return sarifResult;
      }),
    };

    const sarifDoc = {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [sarifRun],
    };

    return JSON.stringify(sarifDoc, null, 2);
  }
}
