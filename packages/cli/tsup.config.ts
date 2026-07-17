import { cpSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  // Bundle only @relay/* workspace packages inline — they're not published to npm
  // so they won't be in node_modules when installed via npx github:.
  // All other deps (fast-glob, c12, simple-git, zod, consola, citty) stay external —
  // they're in package.json dependencies and install normally via npm/npx.
  noExternal: [/@relay\/.*/],
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    __RELAY_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  async onSuccess() {
    try {
      cpSync('../../skills', 'dist/skills', { recursive: true });
    } catch (err) {
      console.warn('Warning: Failed to copy skills directory:', err);
    }
  },
});
