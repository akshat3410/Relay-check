import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'terminal/index': 'src/terminal/index.ts',
    'json/index': 'src/json/index.ts',
    'markdown/index': 'src/markdown/index.ts',
    'sarif/index': 'src/sarif/index.ts',
    'html/index': 'src/html/index.ts',
    'github/index': 'src/github/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
