import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'extract-fact': 'core/tools/extract-fact/extract-fact-ts.ts' },
  outDir: 'dist-plugin/dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  shims: true,
  splitting: false,
  clean: false,
  banner: {
    js: [
      '#!/usr/bin/env node',
      'import { createRequire as __$$createRequire } from "module";',
      'const require = __$$createRequire(import.meta.url);',
    ].join('\n'),
  },
});
