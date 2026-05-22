import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as extractor from './extract-fact-ts.ts';
import * as os from 'node:os';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

test('module exports all pipeline stages', () => {
  assert.equal(typeof extractor.loadConfig, 'function');
  assert.equal(typeof extractor.extractTokens, 'function');
  assert.equal(typeof extractor.collectSourceFiles, 'function');
  assert.equal(typeof extractor.buildProject, 'function');
  assert.equal(typeof extractor.discoverComponentsForPackage, 'function');
  assert.equal(typeof extractor.renderFact, 'function');
});

async function mktempCwd(layout: Record<string, string>): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pastiche-fact-'));
  for (const [rel, content] of Object.entries(layout)) {
    const abs = path.join(dir, rel);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, content);
  }
  return dir;
}

test('loadConfig parses a types-mode config', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens:
  - styles/theme.css
`,
    'dist/index.d.ts': '',
    'styles/theme.css': '',
  });
  const cfg = extractor.loadConfig(cwd);
  assert.equal(cfg.platform, 'claude-code');
  assert.equal(cfg.packages.length, 1);
  assert.equal(cfg.packages[0].name, '@org/web');
  assert.equal(cfg.packages[0].types, 'dist/index.d.ts');
  assert.equal(cfg.packages[0].source_dir, undefined);
  assert.deepEqual(cfg.tokens, ['styles/theme.css']);
});

test('loadConfig parses a source_dir-mode config', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: ui
    source_dir: src/components/ui
tokens:
  - src/app/globals.css
`,
    'src/components/ui/.gitkeep': '',
    'src/app/globals.css': '',
  });
  const cfg = extractor.loadConfig(cwd);
  assert.equal(cfg.packages[0].source_dir, 'src/components/ui');
  assert.equal(cfg.packages[0].types, undefined);
});

test('loadConfig rejects a package entry with neither types nor source_dir', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: bad
tokens: []
`,
  });
  assert.throws(() => extractor.loadConfig(cwd), /exactly one of `types` or `source_dir`/);
});

test('loadConfig rejects a package entry with both types and source_dir', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: bad
    types: a.d.ts
    source_dir: b/
tokens: []
`,
  });
  assert.throws(() => extractor.loadConfig(cwd), /exactly one of `types` or `source_dir`/);
});

test('loadConfig rejects a missing types file', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: gone
    types: missing.d.ts
tokens: []
`,
  });
  assert.throws(() => extractor.loadConfig(cwd), /missing\.d\.ts/);
});

test('loadConfig rejects a missing tokens file', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages: []
tokens:
  - styles/gone.css
`,
  });
  assert.throws(() => extractor.loadConfig(cwd), /gone\.css/);
});

test('loadConfig surfaces YAML parse errors clearly', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': 'packages: [unclosed',
  });
  assert.throws(() => extractor.loadConfig(cwd), /pastiche\/config\.yaml/);
});
