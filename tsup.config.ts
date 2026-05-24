import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'extract-fact': 'scripts/extract-fact-ts.ts' },
  outDir: 'dist-plugin/dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  splitting: false,
  clean: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
