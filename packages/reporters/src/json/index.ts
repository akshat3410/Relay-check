import type { Reporter, ReporterOptions, ReviewResult } from '@relay/shared';

export class JsonReporter implements Reporter {
  name = 'json';

  render(result: ReviewResult, opts: ReporterOptions = {}): string {
    if (opts.ci) {
      // Compact JSON for CI pipelines
      return JSON.stringify(result);
    }
    return JSON.stringify(result, null, 2);
  }
}
