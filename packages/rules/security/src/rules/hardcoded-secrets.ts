import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * SEC-001: Hardcoded Secrets
 *
 * OWASP A02: Cryptographic Failures
 * Detects API keys, tokens, and credentials hardcoded in source files.
 */
export const hardcodedSecretsRule: Rule = {
  id: 'SEC-001',
  name: 'Hardcoded Secrets',
  category: 'security',
  severity: 'critical',
  description: 'Detect hardcoded API keys, tokens, or credentials in source files',
  rationale:
    'Secrets committed to source control are permanently exposed — even after removal, they remain in git history. Leaked credentials cause data breaches, financial loss, and regulatory violations.',
  docs: 'https://relay.dev/rules/SEC-001',
  tags: ['owasp-a02', 'secrets', 'credentials'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    // Patterns ordered by specificity — more specific first to reduce false positives
    const patterns: Array<{ pattern: RegExp; label: string }> = [
      { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS Access Key ID' },
      {
        pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}/g,
        label: 'GitHub Personal Access Token',
      },
      { pattern: /sk-[A-Za-z0-9]{40,}/g, label: 'OpenAI API Key' },
      { pattern: /xox[baprs]-[0-9A-Za-z\-]{10,}/g, label: 'Slack Token' },
      { pattern: /AIza[0-9A-Za-z\-_]{35}/g, label: 'Google API Key' },
      {
        pattern: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g,
        label: 'Google OAuth Client ID',
      },
      {
        pattern: /(?:password|passwd|pwd)\s*[=:]\s*["'][^"']{6,}["']/gi,
        label: 'Hardcoded Password',
      },
      {
        pattern: /(?:secret|api[_-]?key|apikey)\s*[=:]\s*["'][A-Za-z0-9+/=]{16,}["']/gi,
        label: 'Generic API Key',
      },
      {
        pattern: /(?:bearer|token)\s*[=:]\s*["'][A-Za-z0-9._\-]{20,}["']/gi,
        label: 'Bearer Token',
      },
    ];

    // Safe patterns — skip files where these appear (env loading, test fixtures)
    const safePatterns = [
      /process\.env\./,
      /import\.meta\.env\./,
      /os\.environ/,
      /getenv\(/,
      /dotenv/,
      /YOUR_.*_HERE/i,
      /REPLACE_ME/i,
      /PLACEHOLDER/i,
      /example\.com/i,
    ];

    for (const file of ctx.sourceFiles) {
      // Skip test fixtures, example files, and env templates
      if (
        file.relativePath.includes('__fixtures__') ||
        file.relativePath.includes('.example') ||
        file.relativePath.endsWith('.env.example') ||
        file.relativePath.endsWith('.env.template')
      ) {
        continue;
      }

      // Skip if file contains safe patterns (env loading)
      if (safePatterns.some((p) => p.test(file.content))) continue;

      for (const { pattern, label } of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(file.content)) !== null) {
          const lineIndex = file.content.slice(0, match.index).split('\n').length - 1;
          const lineContent = file.lines[lineIndex] ?? '';

          // Skip commented lines
          if (/^\s*[/#*]/.test(lineContent)) continue;

          findings.push({
            ruleId: 'SEC-001',
            ruleName: 'Hardcoded Secrets',
            severity: 'critical',
            category: 'security',
            message: `${label} detected in source`,
            file: file.relativePath,
            line: lineIndex + 1,
            evidence: match[0].slice(0, 20) + (match[0].length > 20 ? '…' : ''),
            suggestion: 'Move to environment variable. Never commit secrets to source control.',
            docs: 'https://relay.dev/rules/SEC-001',
          });
        }
      }
    }

    return findings;
  },
};
