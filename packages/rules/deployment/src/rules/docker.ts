import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * DEPLOY-001: Missing Docker Healthcheck
 */
export const missingDockerHealthcheckRule: Rule = {
  id: 'DEPLOY-001',
  name: 'Missing Docker HEALTHCHECK',
  category: 'deployment',
  severity: 'medium',
  description: 'Ensure Dockerfiles define a HEALTHCHECK directive',
  rationale: 'Without a HEALTHCHECK, orchestrators like Kubernetes or Docker Swarm only know if the container process is running, not if the application is actually healthy and responsive.',
  docs: 'https://relay.dev/rules/DEPLOY-001',
  tags: ['docker', 'deployment', 'reliability'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    for (const file of ctx.sourceFiles) {
      if (file.relativePath.toLowerCase() !== 'dockerfile') continue;

      const hasHealthcheck = /^[ \t]*HEALTHCHECK\b/im.test(file.content);

      if (!hasHealthcheck) {
        findings.push({
          ruleId: 'DEPLOY-001',
          severity: 'medium',
          category: 'deployment',
          message: 'Dockerfile does not define a HEALTHCHECK directive',
          file: file.relativePath,
          suggestion: 'Add a HEALTHCHECK instruction to the Dockerfile, e.g.: HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1',
          docs: 'https://relay.dev/rules/DEPLOY-001',
        });
      }
    }

    return findings;
  },
};

/**
 * DEPLOY-002: Docker Run As Root
 */
export const dockerRunAsRootRule: Rule = {
  id: 'DEPLOY-002',
  name: 'Docker Running as Root User',
  category: 'deployment',
  severity: 'high',
  description: 'Identify Dockerfiles that run processes as the root user',
  rationale: 'Running containers as root violates the principle of least privilege. If a container is compromised, the attacker has root privileges on the host kernel/container namespace.',
  docs: 'https://relay.dev/rules/DEPLOY-002',
  tags: ['docker', 'deployment', 'security'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];

    for (const file of ctx.sourceFiles) {
      if (file.relativePath.toLowerCase() !== 'dockerfile') continue;

      // Check if there is any USER instruction.
      // If there is, verify it is not 'root'
      const userMatches = [...file.content.matchAll(/^[ \t]*USER\s+(\S+)/gim)];

      if (userMatches.length === 0) {
        findings.push({
          ruleId: 'DEPLOY-002',
          severity: 'high',
          category: 'deployment',
          message: 'Dockerfile runs as root (no USER instruction defined)',
          file: file.relativePath,
          suggestion: 'Create a non-root user in the Dockerfile and set it using the USER directive: e.g. USER node or USER appuser.',
          docs: 'https://relay.dev/rules/DEPLOY-002',
        });
      } else {
        const lastUser = userMatches[userMatches.length - 1]?.[1]?.toLowerCase();
        if (lastUser === 'root' || lastUser === '0') {
          findings.push({
            ruleId: 'DEPLOY-002',
            severity: 'high',
            category: 'deployment',
            message: 'Dockerfile explicitly sets USER to root',
            file: file.relativePath,
            suggestion: 'Change USER to a non-root user (e.g. USER node or USER appuser).',
            docs: 'https://relay.dev/rules/DEPLOY-002',
          });
        }
      }
    }

    return findings;
  },
};
