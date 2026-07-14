import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DetectionResult, Framework } from '@relay/shared';

/**
 * FrameworkDetector
 *
 * Multi-layer detection strategy:
 *   Layer 1: package.json dependencies
 *   Layer 2: Config file presence
 *   Layer 3: Directory structure heuristics
 *   Layer 4: Language markers (requirements.txt, go.mod, etc.)
 *   Layer 5: User override (applied before this runs, by ConfigLoader)
 */
export class FrameworkDetector {
  constructor(private readonly cwd: string) {}

  detect(): DetectionResult {
    const evidence: string[] = [];
    const detected: Framework[] = [];

    const pkg = this.readPackageJson();
    const deps = this.allDeps(pkg);

    // ── Layer 1: package.json deps ──────────────────────────────────────────

    if (deps.has('next')) {
      detected.push('nextjs');
      evidence.push('package.json: "next" dependency');
    }
    if (deps.has('nuxt') || deps.has('nuxt3')) {
      detected.push('nuxt');
      evidence.push('package.json: "nuxt" dependency');
    }
    if (deps.has('react') && !detected.includes('nextjs') && !detected.includes('remix')) {
      detected.push('react');
      evidence.push('package.json: "react" dependency (no Next.js/Remix)');
    }
    if (deps.has('vue') && !detected.includes('nuxt')) {
      detected.push('vue');
      evidence.push('package.json: "vue" dependency');
    }
    if (deps.has('@angular/core')) {
      detected.push('angular');
      evidence.push('package.json: "@angular/core" dependency');
    }
    if (deps.has('svelte') && !deps.has('@sveltejs/kit')) {
      detected.push('svelte');
      evidence.push('package.json: "svelte" dependency');
    }
    if (deps.has('@sveltejs/kit')) {
      detected.push('sveltekit');
      evidence.push('package.json: "@sveltejs/kit" dependency');
    }
    if (deps.has('astro')) {
      detected.push('astro');
      evidence.push('package.json: "astro" dependency');
    }
    if (deps.has('@remix-run/react') || deps.has('@remix-run/node')) {
      detected.push('remix');
      evidence.push('package.json: "@remix-run/*" dependency');
    }
    if (deps.has('express')) {
      detected.push('express');
      evidence.push('package.json: "express" dependency');
    }
    if (deps.has('fastify')) {
      detected.push('fastify');
      evidence.push('package.json: "fastify" dependency');
    }
    if (deps.has('@nestjs/core')) {
      detected.push('nestjs');
      evidence.push('package.json: "@nestjs/core" dependency');
    }
    if (deps.has('hono')) {
      detected.push('hono');
      evidence.push('package.json: "hono" dependency');
    }

    // ── Layer 2: Config file presence ────────────────────────────────────────

    if (
      this.fileExists('next.config.js') ||
      this.fileExists('next.config.ts') ||
      this.fileExists('next.config.mjs')
    ) {
      if (!detected.includes('nextjs')) {
        detected.push('nextjs');
        evidence.push('Config file: next.config.*');
      }
    }
    if (this.fileExists('nuxt.config.ts') || this.fileExists('nuxt.config.js')) {
      if (!detected.includes('nuxt')) {
        detected.push('nuxt');
        evidence.push('Config file: nuxt.config.*');
      }
    }
    if (this.fileExists('astro.config.mjs') || this.fileExists('astro.config.ts')) {
      if (!detected.includes('astro')) {
        detected.push('astro');
        evidence.push('Config file: astro.config.*');
      }
    }
    if (
      this.fileExists('remix.config.js') ||
      (this.fileExists('vite.config.ts') && deps.has('@remix-run/react'))
    ) {
      if (!detected.includes('remix')) {
        detected.push('remix');
        evidence.push('Config file: remix.config.js');
      }
    }
    if (this.fileExists('angular.json')) {
      if (!detected.includes('angular')) {
        detected.push('angular');
        evidence.push('Config file: angular.json');
      }
    }
    if (this.fileExists('svelte.config.js') || this.fileExists('svelte.config.ts')) {
      if (!detected.includes('sveltekit') && !detected.includes('svelte')) {
        detected.push('sveltekit');
        evidence.push('Config file: svelte.config.*');
      }
    }

    // ── Layer 3: Python markers ───────────────────────────────────────────────

    if (this.fileExists('requirements.txt') || this.fileExists('pyproject.toml')) {
      const reqContent = this.fileExists('requirements.txt')
        ? this.readFile('requirements.txt')
        : this.readFile('pyproject.toml');

      if (reqContent.includes('fastapi')) {
        detected.push('fastapi');
        evidence.push('requirements.txt: fastapi');
      } else if (reqContent.includes('django')) {
        detected.push('django');
        evidence.push('requirements.txt: django');
      } else if (reqContent.includes('flask')) {
        detected.push('flask');
        evidence.push('requirements.txt: flask');
      }
    }

    // ── Layer 4: Other language markers ──────────────────────────────────────

    if (this.fileExists('composer.json')) {
      const composer = this.readFile('composer.json');
      if (composer.includes('laravel/framework')) {
        detected.push('laravel');
        evidence.push('composer.json: laravel/framework');
      }
    }
    if (this.fileExists('Gemfile')) {
      const gemfile = this.readFile('Gemfile');
      if (gemfile.includes('rails')) {
        detected.push('rails');
        evidence.push('Gemfile: rails');
      }
    }

    // ── Determine primary framework ───────────────────────────────────────────

    const primary = this.resolvePrimary(detected);
    const confidence = this.calcConfidence(detected, evidence);

    return {
      framework: primary,
      allFrameworks: detected,
      confidence,
      evidence,
    };
  }

  private resolvePrimary(detected: Framework[]): Framework {
    if (detected.length === 0) return 'unknown';

    // Priority order — more specific wins
    const priority: Framework[] = [
      'nextjs',
      'nuxt',
      'remix',
      'sveltekit',
      'astro',
      'nestjs',
      'angular',
      'react',
      'vue',
      'svelte',
      'express',
      'fastify',
      'hono',
      'fastapi',
      'django',
      'flask',
      'laravel',
      'rails',
    ];

    for (const fw of priority) {
      if (detected.includes(fw)) return fw;
    }
    return detected[0] ?? 'unknown';
  }

  private calcConfidence(detected: Framework[], evidence: string[]): DetectionResult['confidence'] {
    if (evidence.length >= 2) return 'high';
    if (detected.length > 0) return 'medium';
    return 'low';
  }

  private readPackageJson(): Record<string, unknown> {
    const pkgPath = join(this.cwd, 'package.json');
    if (!existsSync(pkgPath)) return {};
    try {
      return JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private allDeps(pkg: Record<string, unknown>): Set<string> {
    const deps = new Set<string>();
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const section = pkg[key];
      if (section && typeof section === 'object') {
        for (const dep of Object.keys(section)) {
          deps.add(dep);
        }
      }
    }
    return deps;
  }

  private fileExists(filename: string): boolean {
    return existsSync(join(this.cwd, filename));
  }

  private readFile(filename: string): string {
    try {
      return readFileSync(join(this.cwd, filename), 'utf8');
    } catch {
      return '';
    }
  }
}
