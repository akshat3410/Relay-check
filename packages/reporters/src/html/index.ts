import type { Reporter, ReviewResult, Severity } from '@relay/shared';

const STATUS_ICONS: Record<string, string> = {
  ship: '✅',
  warn: '⚠️',
  hold: '❌',
  critical: '🚨',
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#0284c7',
  info: '#4b5563',
};

export class HtmlReporter implements Reporter {
  name = 'html';

  render(result: ReviewResult): string {
    const timestamp = new Date(result.timestamp).toLocaleString();
    const scoreColor = result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-yellow-600' : 'text-red-600';

    const categoriesHtml = result.categoryScores
      .map((cat) => {
        const icon = cat.status === 'pass' ? '✅' : cat.status === 'warn' ? '⚠️' : '❌';
        return `
          <tr class="border-b border-gray-100">
            <td class="py-3 px-4 text-sm font-medium text-gray-800">${cat.category}</td>
            <td class="py-3 px-4 text-sm font-semibold">${cat.score}/${cat.maxScore}</td>
            <td class="py-3 px-4 text-sm text-gray-500">${cat.findingCount}</td>
            <td class="py-3 px-4 text-sm">${icon} <span class="capitalize font-medium">${cat.status}</span></td>
          </tr>
        `;
      })
      .join('');

    const findingsHtml = result.findings
      .map((finding) => {
        const sevColor = SEVERITY_COLORS[finding.severity] ?? '#4b5563';
        const loc = finding.file
          ? finding.line
            ? `${finding.file}:${finding.line}`
            : finding.file
          : '';

        return `
          <div class="p-5 border border-gray-200 rounded-xl hover:border-gray-300 transition-all bg-white shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase text-white" style="background-color: ${sevColor};">
                ${finding.severity}
              </span>
              <span class="text-sm font-bold text-gray-700">${finding.ruleId}</span>
              <h3 class="text-base font-semibold text-gray-900 flex-1">${finding.message}</h3>
            </div>
            ${loc ? `<div class="text-sm text-gray-500 font-mono mt-1">📍 ${loc}</div>` : ''}
            ${finding.evidence ? `<div class="text-sm bg-gray-50 p-2.5 rounded border border-gray-100 font-mono text-gray-700 mt-2 truncate">Evidence: ${finding.evidence}</div>` : ''}
            ${finding.suggestion ? `<div class="text-sm text-emerald-700 font-medium mt-1">💡 Suggestion: ${finding.suggestion}</div>` : ''}
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relay Review Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
  </style>
</head>
<body class="bg-gray-50/50 min-h-screen pb-16">
  <div class="max-w-4xl mx-auto px-4 pt-12">
    <!-- Header -->
    <div class="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span>⚡</span> Relay Review Report
        </h1>
        <p class="text-sm text-gray-500 mt-1">Framework: <span class="font-semibold text-gray-700 uppercase">${result.framework}</span> &bull; Generated: ${timestamp}</p>
        <p class="text-xs text-gray-400 mt-2">${result.rulesRun} rules run &bull; v${result.version}</p>
      </div>
      
      <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-[240px] justify-center">
        <div class="text-center">
          <div class="text-4xl font-extrabold ${scoreColor}">${result.score}<span class="text-xl text-gray-400">/100</span></div>
          <div class="text-xs font-semibold text-gray-500 mt-0.5">Overall Score</div>
        </div>
        <div class="w-px h-10 bg-gray-200"></div>
        <div class="text-center">
          <div class="text-3xl">${STATUS_ICONS[result.status] ?? ''}</div>
          <div class="text-xs font-bold text-gray-700 uppercase mt-1">${result.status}</div>
        </div>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8">
      <div class="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
        <div class="text-2xl font-bold text-red-600">${result.summary.critical}</div>
        <div class="text-xs font-medium text-gray-500 mt-0.5">Critical</div>
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
        <div class="text-2xl font-bold text-orange-600">${result.summary.high}</div>
        <div class="text-xs font-medium text-gray-500 mt-0.5">High</div>
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
        <div class="text-2xl font-bold text-yellow-600">${result.summary.medium}</div>
        <div class="text-xs font-medium text-gray-500 mt-0.5">Medium</div>
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
        <div class="text-2xl font-bold text-sky-600">${result.summary.low}</div>
        <div class="text-xs font-medium text-gray-500 mt-0.5">Low</div>
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
        <div class="text-2xl font-bold text-gray-600">${result.summary.total}</div>
        <div class="text-xs font-medium text-gray-500 mt-0.5">Total Findings</div>
      </div>
    </div>

    <!-- Category Scores -->
    <div class="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mt-8">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Category Analysis</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200 text-xs font-bold uppercase text-gray-400">
              <th class="pb-3 px-4">Category</th>
              <th class="pb-3 px-4">Score</th>
              <th class="pb-3 px-4">Findings</th>
              <th class="pb-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            ${categoriesHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Findings -->
    <div class="mt-8">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Findings Details</h2>
      <div class="flex flex-col gap-4">
        ${findingsHtml || '<div class="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">🎉 No issues found! Your project is clean and ready.</div>'}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
