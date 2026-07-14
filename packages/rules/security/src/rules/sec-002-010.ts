import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * SEC-002: No HTTPS Enforcement
 * OWASP A02: Cryptographic Failures
 */
export const httpsEnforcementRule: Rule = {
  id: 'SEC-002',
  name: 'Missing HTTPS Enforcement',
  category: 'security',
  severity: 'high',
  description: 'Detect HTTP URLs used in production configuration where HTTPS should be required',
  rationale:
    'HTTP transmits data in plaintext. Man-in-the-middle attacks can steal session tokens, passwords, and PII.',
  docs: 'https://relay.dev/rules/SEC-002',
  tags: ['owasp-a02', 'transport-security'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    // Only check config and environment files, not source logic
    const configExts = new Set(['json', 'yaml', 'yml', 'toml', 'env']);

    for (const file of ctx.sourceFiles) {
      if (!configExts.has(file.extension)) continue;
      if (file.relativePath.includes('test') || file.relativePath.includes('spec')) continue;

      const httpPattern = /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|::1)[a-zA-Z0-9]/g;
      let match: RegExpExecArray | null;

      while ((match = httpPattern.exec(file.content)) !== null) {
        const line = file.content.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'SEC-002',
          ruleName: 'Missing HTTPS Enforcement',
          severity: 'high',
          category: 'security',
          message: 'HTTP URL in production config — should be HTTPS',
          file: file.relativePath,
          line,
          evidence: match[0],
          suggestion: 'Replace http:// with https://',
          docs: 'https://relay.dev/rules/SEC-002',
        });
      }
    }

    return findings;
  },
};

/**
 * SEC-003: Dependency Vulnerabilities (known outdated patterns)
 * OWASP A06: Vulnerable and Outdated Components
 */
export const vulnerableDepsRule: Rule = {
  id: 'SEC-003',
  name: 'Potentially Vulnerable Dependencies',
  category: 'security',
  severity: 'high',
  description: 'Detect known vulnerable dependency versions or missing lockfile',
  rationale:
    'Outdated dependencies with known CVEs are one of the most common attack vectors. Lockfiles ensure reproducible installs.',
  docs: 'https://relay.dev/rules/SEC-003',
  tags: ['owasp-a06', 'dependencies', 'supply-chain'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    // Check for missing lockfile — makes supply chain attacks easier
    if (!ctx.hasLockfile) {
      findings.push({
        ruleId: 'SEC-003',
        ruleName: 'Potentially Vulnerable Dependencies',
        severity: 'high',
        category: 'security',
        message: 'No lockfile found — dependency versions are non-deterministic',
        suggestion:
          'Commit pnpm-lock.yaml / package-lock.json / yarn.lock to ensure reproducible builds',
        docs: 'https://relay.dev/rules/SEC-003',
      });
    }

    // Check for wildcard versions (e.g., "*", "latest") in production deps
    for (const dep of ctx.dependencies) {
      if (dep.isDev) continue;
      if (dep.version === '*' || dep.version === 'latest' || dep.version === 'x') {
        findings.push({
          ruleId: 'SEC-003',
          ruleName: 'Potentially Vulnerable Dependencies',
          severity: 'medium',
          category: 'security',
          message: `Wildcard version for "${dep.name}" — pins to unknown future version`,
          file: 'package.json',
          evidence: `"${dep.name}": "${dep.version}"`,
          suggestion: `Pin to a specific version: "${dep.name}": "^X.Y.Z"`,
          docs: 'https://relay.dev/rules/SEC-003',
        });
      }
    }

    return findings;
  },
};

/**
 * SEC-004: Exposed .env Files
 * OWASP A02: Cryptographic Failures
 */
export const exposedEnvRule: Rule = {
  id: 'SEC-004',
  name: 'Exposed .env Files',
  category: 'security',
  severity: 'critical',
  description: 'Detect .env files tracked in git (not in .gitignore)',
  rationale:
    '.env files contain secrets. If tracked in git, they are exposed to anyone with repository access and permanently in history.',
  docs: 'https://relay.dev/rules/SEC-004',
  tags: ['owasp-a02', 'secrets', 'env'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    // Check if .gitignore exists and contains .env
    const gitignore = ctx.sourceFiles.find((f) => f.relativePath === '.gitignore');
    const envFiles = ctx.sourceFiles.filter(
      (f) =>
        f.relativePath === '.env' ||
        f.relativePath.match(/^\.env\.(local|production|staging|development)$/)
    );

    if (envFiles.length === 0) return [];

    const hasGitignore = !!gitignore;
    const gitignoreContent = gitignore?.content ?? '';

    for (const envFile of envFiles) {
      const filename = envFile.relativePath;
      const isIgnored =
        gitignoreContent.includes(filename) ||
        gitignoreContent.includes('.env') ||
        gitignoreContent.includes('*.env');

      if (!isIgnored) {
        findings.push({
          ruleId: 'SEC-004',
          ruleName: 'Exposed .env Files',
          severity: 'critical',
          category: 'security',
          message: `${filename} is not in .gitignore and may be tracked in git`,
          file: filename,
          suggestion: hasGitignore
            ? `Add "${filename}" to .gitignore immediately. Then: git rm --cached ${filename}`
            : `Create .gitignore and add "${filename}" to it. Then: git rm --cached ${filename}`,
          docs: 'https://relay.dev/rules/SEC-004',
        });
      }
    }

    return findings;
  },
};

/**
 * SEC-005: eval() Usage
 * OWASP A03: Injection
 */
export const evalUsageRule: Rule = {
  id: 'SEC-005',
  name: 'eval() Usage',
  category: 'security',
  severity: 'critical',
  description: 'Detect eval() and equivalent dynamic code execution in source',
  rationale:
    'eval() executes arbitrary strings as code. If the string contains user input, it is a Remote Code Execution (RCE) vulnerability.',
  docs: 'https://relay.dev/rules/SEC-005',
  tags: ['owasp-a03', 'injection', 'rce'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const evalPatterns = [
      /\beval\s*\(/g,
      /new\s+Function\s*\(/g,
      /setTimeout\s*\(\s*["'`]/g,
      /setInterval\s*\(\s*["'`]/g,
    ];

    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']);

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;
      if (file.relativePath.includes('test') || file.relativePath.includes('spec')) continue;

      for (const pattern of evalPatterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(file.content)) !== null) {
          const line = file.content.slice(0, match.index).split('\n').length;
          const lineContent = (file.lines[line - 1] ?? '').trim();
          if (lineContent.startsWith('//') || lineContent.startsWith('*')) continue;

          findings.push({
            ruleId: 'SEC-005',
            ruleName: 'eval() Usage',
            severity: 'critical',
            category: 'security',
            message: `Dynamic code execution: ${match[0].trim()}`,
            file: file.relativePath,
            line,
            evidence: match[0],
            suggestion:
              'Replace with a safer alternative. If unavoidable, ensure input is strictly validated and never user-controlled.',
            docs: 'https://relay.dev/rules/SEC-005',
          });
        }
      }
    }

    return findings;
  },
};

/**
 * SEC-006: SQL Injection Risk
 * OWASP A03: Injection
 */
export const sqlInjectionRule: Rule = {
  id: 'SEC-006',
  name: 'Potential SQL Injection',
  category: 'security',
  severity: 'critical',
  description: 'Detect string concatenation used to build SQL queries',
  rationale:
    'String-concatenated SQL queries are vulnerable to injection attacks that can read, modify, or delete all database data.',
  docs: 'https://relay.dev/rules/SEC-006',
  tags: ['owasp-a03', 'injection', 'sql'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    // Detect: db.query("SELECT..." + userInput) or `SELECT ${variable}`
    const patterns = [
      /(?:query|execute|exec|run)\s*\(\s*["'`].*(?:SELECT|INSERT|UPDATE|DELETE|DROP).*["'`]\s*\+/gi,
      /["'`](?:SELECT|INSERT|UPDATE|DELETE)\s+.*\$\{/gi,
    ];

    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs']);

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(file.content)) !== null) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'SEC-006',
            ruleName: 'Potential SQL Injection',
            severity: 'critical',
            category: 'security',
            message: 'SQL query built with string concatenation or interpolation',
            file: file.relativePath,
            line,
            evidence: match[0].slice(0, 60),
            suggestion:
              'Use parameterized queries or a query builder (e.g., Prisma, Drizzle, knex). Never interpolate user input into SQL.',
            docs: 'https://relay.dev/rules/SEC-006',
          });
        }
      }
    }

    return findings;
  },
};

/**
 * SEC-007: Missing CSRF Protection
 * OWASP A01: Broken Access Control
 */
export const csrfProtectionRule: Rule = {
  id: 'SEC-007',
  name: 'Missing CSRF Protection',
  category: 'security',
  severity: 'high',
  frameworks: ['express', 'nextjs', 'fastify'],
  description: 'Detect Express/Next.js apps without CSRF protection middleware',
  rationale:
    'Without CSRF protection, malicious sites can forge requests on behalf of authenticated users, potentially changing passwords, making purchases, or deleting data.',
  docs: 'https://relay.dev/rules/SEC-007',
  tags: ['owasp-a01', 'csrf'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const hasCsrfPackage = ctx.dependencies.some(
      (d) => d.name === 'csurf' || d.name === 'csrf-csrf' || d.name === 'tiny-csrf'
    );

    if (!hasCsrfPackage && ctx.allFrameworks.some((f) => ['express', 'fastify'].includes(f))) {
      findings.push({
        ruleId: 'SEC-007',
        ruleName: 'Missing CSRF Protection',
        severity: 'high',
        category: 'security',
        message: 'No CSRF protection package detected for Express/Fastify app',
        suggestion:
          'Install csrf-csrf and apply middleware to all state-changing routes (POST, PUT, DELETE, PATCH)',
        docs: 'https://relay.dev/rules/SEC-007',
      });
    }

    return findings;
  },
};

/**
 * SEC-008: Console.log with Sensitive Data
 * OWASP A09: Security Logging and Monitoring Failures
 */
export const consoleLogSecretsRule: Rule = {
  id: 'SEC-008',
  name: 'Sensitive Data in Logs',
  category: 'security',
  severity: 'high',
  description: 'Detect console.log statements that may expose sensitive data',
  rationale:
    'Logging passwords, tokens, or PII violates privacy regulations (GDPR, CCPA) and creates audit trails that expose user data.',
  docs: 'https://relay.dev/rules/SEC-008',
  tags: ['owasp-a09', 'logging', 'privacy'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const pattern =
      /console\.log\s*\([^)]*(?:password|token|secret|key|auth|credential|ssn|credit.?card)[^)]*\)/gi;
    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx']);

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;
      if (file.relativePath.includes('test') || file.relativePath.includes('spec')) continue;

      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(file.content)) !== null) {
        const line = file.content.slice(0, match.index).split('\n').length;
        findings.push({
          ruleId: 'SEC-008',
          ruleName: 'Sensitive Data in Logs',
          severity: 'high',
          category: 'security',
          message: 'console.log may expose sensitive data',
          file: file.relativePath,
          line,
          evidence: match[0].slice(0, 60),
          suggestion:
            'Remove sensitive data from logs, or use a structured logger with field masking',
          docs: 'https://relay.dev/rules/SEC-008',
        });
      }
    }

    return findings;
  },
};

/**
 * SEC-009: Missing Security Headers
 * OWASP A05: Security Misconfiguration
 */
export const securityHeadersRule: Rule = {
  id: 'SEC-009',
  name: 'Missing Security Headers',
  category: 'security',
  severity: 'medium',
  frameworks: ['nextjs', 'express', 'fastify'],
  description: 'Check for security headers configuration in Next.js or Express apps',
  rationale:
    'Missing security headers leave browsers unprotected against XSS, clickjacking, MIME sniffing, and other client-side attacks.',
  docs: 'https://relay.dev/rules/SEC-009',
  tags: ['owasp-a05', 'headers', 'xss'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    // Next.js: check next.config.js for headers()
    if (ctx.allFrameworks.includes('nextjs')) {
      const nextConfig = ctx.sourceFiles.find((f) =>
        f.relativePath.match(/next\.config\.(js|ts|mjs)/)
      );

      if (nextConfig && !nextConfig.content.includes('headers')) {
        findings.push({
          ruleId: 'SEC-009',
          ruleName: 'Missing Security Headers',
          severity: 'medium',
          category: 'security',
          message: 'next.config does not configure security headers',
          file: nextConfig.relativePath,
          suggestion:
            'Add a headers() function in next.config.js with Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy',
          docs: 'https://relay.dev/rules/SEC-009',
        });
      }
    }

    // Check for helmet in Express apps
    if (ctx.allFrameworks.some((f) => ['express', 'fastify'].includes(f))) {
      const hasHelmet = ctx.dependencies.some((d) => d.name === 'helmet');
      if (!hasHelmet) {
        findings.push({
          ruleId: 'SEC-009',
          ruleName: 'Missing Security Headers',
          severity: 'medium',
          category: 'security',
          message: 'No helmet or equivalent security header middleware detected',
          suggestion: 'Install and configure helmet: app.use(helmet())',
          docs: 'https://relay.dev/rules/SEC-009',
        });
      }
    }

    return findings;
  },
};

/**
 * SEC-010: Prototype Pollution Risk
 * OWASP A03: Injection
 */
export const prototypePollutionRule: Rule = {
  id: 'SEC-010',
  name: 'Prototype Pollution Risk',
  category: 'security',
  severity: 'high',
  description: 'Detect patterns that may enable prototype pollution attacks',
  rationale:
    'Prototype pollution allows attackers to modify Object.prototype, potentially leading to RCE, authentication bypass, or privilege escalation.',
  docs: 'https://relay.dev/rules/SEC-010',
  tags: ['owasp-a03', 'prototype-pollution'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const patterns = [
      /Object\.assign\s*\(\s*\w+\s*,\s*(?:req|request)\./g,
      /\.\.\.\s*(?:req|request)\.(?:body|query|params)/g,
      /Object\.keys\s*\(.*(?:req|request)\.body\)/g,
    ];

    const jsLike = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs']);

    for (const file of ctx.sourceFiles) {
      if (!jsLike.has(file.extension)) continue;

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(file.content)) !== null) {
          const line = file.content.slice(0, match.index).split('\n').length;
          findings.push({
            ruleId: 'SEC-010',
            ruleName: 'Prototype Pollution Risk',
            severity: 'high',
            category: 'security',
            message:
              'Unsafe spread/assign of request body onto object — potential prototype pollution',
            file: file.relativePath,
            line,
            evidence: match[0].trim(),
            suggestion:
              'Validate and sanitize request input with a schema validator (zod, joi) before spreading onto objects',
            docs: 'https://relay.dev/rules/SEC-010',
          });
        }
      }
    }

    return findings;
  },
};
