import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { DependencyInfo, Framework, GitInfo, ProjectContext, SourceFile } from '@relay/shared';
import fg from 'fast-glob';
import type { SimpleGit } from 'simple-git';
import { simpleGit } from 'simple-git';

// File extensions to collect for static analysis
const SOURCE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'vue',
  'svelte',
  'astro',
  'py',
  'go',
  'rb',
  'php',
  'json',
  'yaml',
  'yml',
  'toml',
  'env',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'md',
  'mdx',
]);

// Max file size to read (4 MB) — skip binary/huge files
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

// Default ignore patterns
const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
];

export interface ContextBuilderOptions {
  cwd: string;
  framework: Framework;
  allFrameworks: Framework[];
  relayVersion: string;
  include?: string[];
  exclude?: string[];
  meta?: Record<string, unknown>;
}

export class ContextBuilder {
  constructor(private readonly opts: ContextBuilderOptions) {}

  async build(): Promise<ProjectContext> {
    const [packageJson, sourceFiles, git] = await Promise.all([
      this.readPackageJson(),
      this.collectSourceFiles(),
      this.collectGitInfo(),
    ]);

    const dependencies = this.extractDependencies(packageJson);
    const configFiles = this.findConfigFiles();
    const packageManager = this.detectPackageManager();

    return {
      cwd: this.opts.cwd,
      framework: this.opts.framework,
      allFrameworks: this.opts.allFrameworks,
      packageJson,
      dependencies,
      sourceFiles,
      configFiles,
      git,
      hasLockfile: this.hasLockfile(),
      packageManager,
      scannedAt: new Date().toISOString(),
      relayVersion: this.opts.relayVersion,
      meta: this.opts.meta ?? {},
    };
  }

  private async readPackageJson(): Promise<Record<string, unknown> | null> {
    const path = join(this.opts.cwd, 'package.json');
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async collectSourceFiles(): Promise<SourceFile[]> {
    const ignore = [...DEFAULT_IGNORE, ...(this.opts.exclude ?? [])];
    const include = this.opts.include ?? ['**/*'];

    const paths = await fg(include, {
      cwd: this.opts.cwd,
      ignore,
      onlyFiles: true,
      followSymbolicLinks: false,
      absolute: true,
    });

    const files: SourceFile[] = [];

    for (const absPath of paths) {
      const ext = absPath.split('.').pop() ?? '';
      if (!SOURCE_EXTENSIONS.has(ext)) continue;

      try {
        const stat = statSync(absPath);
        if (stat.size > MAX_FILE_SIZE_BYTES) continue;

        const content = readFileSync(absPath, 'utf8');
        const lines = content.split('\n');

        files.push({
          path: absPath,
          relativePath: relative(this.opts.cwd, absPath),
          extension: ext,
          content,
          lines,
          sizeBytes: stat.size,
        });
      } catch {
        // Skip unreadable files silently
      }
    }

    return files;
  }

  private async collectGitInfo(): Promise<GitInfo | null> {
    if (!existsSync(join(this.opts.cwd, '.git'))) return null;

    try {
      const git: SimpleGit = simpleGit(this.opts.cwd);
      const [log, status, remotes] = await Promise.all([
        git.log({ maxCount: 1 }),
        git.status(),
        git.getRemotes(true),
      ]);

      const latest = log.latest;
      const remote = remotes[0];

      // Sanitize remote URL — remove any embedded tokens
      const rawUrl = remote?.refs?.fetch ?? null;
      const remoteUrl = rawUrl ? rawUrl.replace(/https?:\/\/[^@]+@/, 'https://') : null;

      return {
        branch: status.current,
        commitHash: latest?.hash?.slice(0, 8) ?? null,
        commitMessage: latest?.message ?? null,
        commitAuthor: latest?.author_name ?? null,
        commitDate: latest?.date ?? null,
        uncommittedChanges: status.files.length,
        hasRemote: remotes.length > 0,
        remoteUrl,
      };
    } catch {
      return null;
    }
  }

  private extractDependencies(pkg: Record<string, unknown> | null): DependencyInfo[] {
    if (!pkg) return [];
    const deps: DependencyInfo[] = [];

    const add = (obj: unknown, isDev: boolean, isPeer: boolean) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [name, version] of Object.entries(obj)) {
        deps.push({ name, version: String(version), isDev, isPeer });
      }
    };

    add(pkg.dependencies, false, false);
    add(pkg.devDependencies, true, false);
    add(pkg.peerDependencies, false, true);

    return deps;
  }

  private findConfigFiles(): string[] {
    const candidates = [
      '.relayrc.json',
      'relay.config.ts',
      'relay.config.js',
      'next.config.js',
      'next.config.ts',
      'next.config.mjs',
      'vite.config.ts',
      'vite.config.js',
      'tsconfig.json',
      'jsconfig.json',
      '.env',
      '.env.local',
      '.env.production',
      'docker-compose.yml',
      'docker-compose.yaml',
      'Dockerfile',
      '.github/workflows',
      'vercel.json',
      'netlify.toml',
      'fly.toml',
    ];

    return candidates.filter((f) => existsSync(join(this.opts.cwd, f)));
  }

  private hasLockfile(): boolean {
    return (
      existsSync(join(this.opts.cwd, 'pnpm-lock.yaml')) ||
      existsSync(join(this.opts.cwd, 'package-lock.json')) ||
      existsSync(join(this.opts.cwd, 'yarn.lock')) ||
      existsSync(join(this.opts.cwd, 'bun.lockb'))
    );
  }

  private detectPackageManager(): ProjectContext['packageManager'] {
    if (existsSync(join(this.opts.cwd, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(this.opts.cwd, 'yarn.lock'))) return 'yarn';
    if (existsSync(join(this.opts.cwd, 'bun.lockb'))) return 'bun';
    if (existsSync(join(this.opts.cwd, 'package-lock.json'))) return 'npm';
    return 'unknown';
  }
}
