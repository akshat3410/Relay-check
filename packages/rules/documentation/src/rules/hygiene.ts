import type { Finding, ProjectContext, Rule } from '@relay/shared';

/**
 * DOC-001: Missing README
 */
export const missingReadmeRule: Rule = {
  id: 'DOC-001',
  name: 'Missing README File',
  category: 'documentation',
  severity: 'high',
  description: 'Ensure a README.md file exists in the project root',
  rationale: 'The README is the primary entry point for developers and users. It should explain what the project is, how to install dependencies, and how to run the project.',
  docs: 'https://relay.dev/rules/DOC-001',
  tags: ['documentation', 'repository-hygiene'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const readmeFile = ctx.sourceFiles.find(
      (f) => f.relativePath.toLowerCase() === 'readme.md' || f.relativePath.toLowerCase() === 'readme'
    );

    if (!readmeFile) {
      findings.push({
        ruleId: 'DOC-001',
        severity: 'high',
        category: 'documentation',
        message: 'No README.md file detected in the project root',
        suggestion: 'Create a README.md file in the root of the project to document install, build, and usage instructions.',
        docs: 'https://relay.dev/rules/DOC-001',
      });
    }

    return findings;
  },
};

/**
 * DOC-002: Missing LICENSE
 */
export const missingLicenseRule: Rule = {
  id: 'DOC-002',
  name: 'Missing LICENSE File',
  category: 'documentation',
  severity: 'medium',
  description: 'Ensure a LICENSE file exists in the project root',
  rationale: 'Without an explicit license, a repository falls under default copyright laws, meaning no one can legally copy, distribute, or modify the code.',
  docs: 'https://relay.dev/rules/DOC-002',
  tags: ['documentation', 'repository-hygiene', 'legal'],

  execute(ctx: ProjectContext): Finding[] {
    const findings: Finding[] = [];
    const licenseNames = new Set(['license', 'license.md', 'license.txt', 'copying', 'copying.md', 'copying.txt']);

    const hasLicense = ctx.sourceFiles.some((f) => licenseNames.has(f.relativePath.toLowerCase()));

    if (!hasLicense) {
      findings.push({
        ruleId: 'DOC-002',
        severity: 'medium',
        category: 'documentation',
        message: 'No LICENSE file detected in the project root',
        suggestion: 'Add an open source LICENSE file (e.g. MIT, Apache-2.0, GPL-3.0) to your repository root.',
        docs: 'https://relay.dev/rules/DOC-002',
      });
    }

    return findings;
  },
};
