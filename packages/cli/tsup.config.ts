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
