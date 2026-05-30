import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as extractor from './extract-fact-ts.ts';
import * as os from 'node:os';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(new URL('./extract-fact-ts.ts', import.meta.url));

const TSX_LOADER = fileURLToPath(
  new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url),
);

function runMain(cwd: string): { stdout: string; stderr: string; status: number } {
  const res = spawnSync(process.execPath, ['--import', TSX_LOADER, SCRIPT_PATH], {
    cwd,
    encoding: 'utf8',
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status ?? -1 };
}

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
  assert.deepEqual(cfg.packages[0].types, ['dist/index.d.ts']);
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

test('extractTokens harvests --* from @theme block', async () => {
  const cwd = await mktempCwd({
    'theme.css': `@theme { --color-primary: red; --color-bg: white; }`,
  });
  const tokens = extractor.extractTokens(['theme.css'], cwd);
  assert.deepEqual(tokens.filter(t => t.startsWith('--')), ['--color-primary', '--color-bg']);
});

test('extractTokens harvests --* from :root block', async () => {
  const cwd = await mktempCwd({
    'tokens.css': `:root { --fg: #000; --bg: #fff; }`,
  });
  const tokens = extractor.extractTokens(['tokens.css'], cwd);
  assert.deepEqual(tokens, ['--fg', '--bg']);
});

test('extractTokens harvests --* from arbitrary selectors and nested blocks', async () => {
  const cwd = await mktempCwd({
    'theme.css': `
      :root { --light-bg: white; }
      [data-theme="dark"] { --dark-bg: black; }
      .dark { --override: gray; }
    `,
  });
  const tokens = extractor.extractTokens(['theme.css'], cwd);
  assert.ok(tokens.includes('--light-bg'));
  assert.ok(tokens.includes('--dark-bg'));
  assert.ok(tokens.includes('--override'));
});

test('extractTokens harvests class selectors', async () => {
  const cwd = await mktempCwd({
    'utilities.css': `.text-h1 { font-size: 2rem; } .btn-primary { color: white; }`,
  });
  const tokens = extractor.extractTokens(['utilities.css'], cwd);
  assert.ok(tokens.includes('.text-h1'));
  assert.ok(tokens.includes('.btn-primary'));
});

test('extractTokens strips /* */ comments', async () => {
  const cwd = await mktempCwd({
    'theme.css': `
      /* :root { --commented-out: hide; } */
      :root { --real: show; }
    `,
  });
  const tokens = extractor.extractTokens(['theme.css'], cwd);
  assert.ok(tokens.includes('--real'));
  assert.ok(!tokens.includes('--commented-out'));
});

test('extractTokens dedupes across multiple files first-encountered-wins (silent)', async () => {
  const cwd = await mktempCwd({
    'a.css': `:root { --shared: red; --only-a: 1; }`,
    'b.css': `:root { --shared: blue; --only-b: 2; }`,
  });
  const tokens = extractor.extractTokens(['a.css', 'b.css'], cwd);
  const seen = new Set(tokens);
  assert.equal(seen.size, tokens.length); // no dupes
  assert.ok(tokens.includes('--shared'));
  assert.ok(tokens.includes('--only-a'));
  assert.ok(tokens.includes('--only-b'));
  assert.equal(tokens.indexOf('--shared'), tokens.indexOf('--shared'));
});

test('extractTokens does not match var() usages as declarations', async () => {
  const cwd = await mktempCwd({
    'theme.css': `:root { --real: red; } .btn { color: var(--real); background: var(--unused-elsewhere); }`,
  });
  const tokens = extractor.extractTokens(['theme.css'], cwd);
  assert.ok(tokens.includes('--real'));
  assert.ok(!tokens.includes('--unused-elsewhere'));
});

test('extractTokens does not match keyframe selectors as classes', async () => {
  const cwd = await mktempCwd({
    'anim.css': `@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } } .spinner { animation: spin 1s; }`,
  });
  const tokens = extractor.extractTokens(['anim.css'], cwd);
  assert.ok(tokens.includes('.spinner'));
  assert.ok(!tokens.includes('.from'));
  assert.ok(!tokens.includes('.to'));
});

test('collectSourceFiles returns .tsx and .ts files sorted', async () => {
  const cwd = await mktempCwd({
    'src/ui/Card.tsx': '',
    'src/ui/Button.tsx': '',
    'src/ui/types.ts': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.basename(f));
  assert.deepEqual(names, ['Button.tsx', 'Card.tsx', 'types.ts']);
});

test('collectSourceFiles recurses into subdirectories', async () => {
  const cwd = await mktempCwd({
    'src/ui/Button.tsx': '',
    'src/ui/forms/Input.tsx': '',
    'src/ui/forms/Select.tsx': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.relative(path.join(cwd, 'src/ui'), f));
  assert.ok(names.includes('Button.tsx'));
  assert.ok(names.includes(path.join('forms', 'Input.tsx')));
  assert.ok(names.includes(path.join('forms', 'Select.tsx')));
});

test('collectSourceFiles skips .test, .stories, .spec sidecars', async () => {
  const cwd = await mktempCwd({
    'src/ui/Button.tsx': '',
    'src/ui/Button.test.tsx': '',
    'src/ui/Button.stories.tsx': '',
    'src/ui/Button.spec.tsx': '',
    'src/ui/Card.test.ts': '',
    'src/ui/Helper.stories.ts': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.basename(f));
  assert.deepEqual(names, ['Button.tsx']);
});

test('collectSourceFiles skips .d.ts files', async () => {
  const cwd = await mktempCwd({
    'src/ui/Button.tsx': '',
    'src/ui/types.d.ts': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.basename(f));
  assert.deepEqual(names, ['Button.tsx']);
});

test('collectSourceFiles skips .jsx and .js files', async () => {
  const cwd = await mktempCwd({
    'src/ui/Button.tsx': '',
    'src/ui/legacy.js': '',
    'src/ui/old.jsx': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.basename(f));
  assert.deepEqual(names, ['Button.tsx']);
});

test('collectSourceFiles output is deterministic regardless of filesystem order', async () => {
  const cwd = await mktempCwd({
    'src/ui/Zeta.tsx': '',
    'src/ui/Yankee.tsx': '',
    'src/ui/Alpha.tsx': '',
  });
  const files = extractor.collectSourceFiles('src/ui', cwd);
  const names = files.map(f => path.basename(f));
  assert.deepEqual(names, ['Alpha.tsx', 'Yankee.tsx', 'Zeta.tsx']);
});

test('buildProject loads a types-mode package', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `export interface ButtonProps { size?: 'sm' | 'md'; }`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { project, packageSources } = extractor.buildProject(cfg, cwd);
  assert.equal(project.getSourceFiles().length, 1);
  const sources = packageSources.get('@org/web');
  assert.ok(sources);
  assert.equal(sources.length, 1);
  assert.ok(sources[0].getFilePath().endsWith('dist/index.d.ts'));
});

test('buildProject loads a source_dir-mode package', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: ui
    source_dir: src/components/ui
tokens: []
`,
    'src/components/ui/Button.tsx': `export interface ButtonProps {} export const Button = (_: ButtonProps) => null;`,
    'src/components/ui/Card.tsx': `export interface CardProps {} export const Card = (_: CardProps) => null;`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const sources = packageSources.get('ui');
  assert.ok(sources);
  assert.equal(sources.length, 2);
});

test('buildProject shares one Project across multiple packages', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: web/index.d.ts
  - name: "@org/form"
    types: form/index.d.ts
tokens: []
`,
    'web/index.d.ts': `export interface ButtonProps {}`,
    'form/index.d.ts': `export interface InputProps {}`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { project, packageSources } = extractor.buildProject(cfg, cwd);
  assert.equal(project.getSourceFiles().length, 2);
  assert.equal(packageSources.size, 2);
});

test('discoverComponentsForPackage finds a simple component from a .d.ts file', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface ButtonProps {
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary';
}
export declare const Button: React.FC<ButtonProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const sources = packageSources.get('@org/web')!;
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], sources);
  assert.equal(comps.length, 1);
  assert.equal(comps[0].name, 'Button');
  assert.equal(comps[0].pkg, '@org/web');
});

test('discoverComponentsForPackage finds components from source files', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: ui
    source_dir: src
tokens: []
`,
    'src/Button.tsx': `
import * as React from 'react';
export interface ButtonProps { size?: 'sm' | 'md'; }
export const Button = (_: ButtonProps) => null;
`,
    'src/Card.tsx': `
import * as React from 'react';
export interface CardProps { hoverable?: boolean; }
export const Card = (_: CardProps) => null;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('ui')!);
  const names = comps.map(c => c.name).sort();
  assert.deepEqual(names, ['Button', 'Card']);
});

test('discoverComponentsForPackage finds compound components (Foo.Bar)', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface CardRootProps {}
export interface CardHeaderProps {}
export declare const CardRoot: React.FC<CardRootProps>;
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const Card: typeof CardRoot & { Header: typeof CardHeader };
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const names = comps.map(c => c.name);
  assert.ok(names.includes('Card'));
  assert.ok(names.includes('Card.Header'));
  assert.ok(!names.includes('CardHeader'));
});

test('renderFact emits a components header and tokens header', () => {
  const out = extractor.renderFact([], []);
  assert.ok(out.startsWith('<!-- AUTO-GENERATED'));
  assert.ok(out.includes('## Components'));
  assert.ok(out.includes('## Tokens'));
});

test('renderFact emits a no-props atom as one-line flow', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface SpinnerProps {}
export declare const Spinner: React.FC<SpinnerProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.ok(out.includes('Spinner: { pkg: "@org/web" }'));
});

test('renderFact emits literal-union props as YAML flow arrays of barewords', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface ButtonProps { size?: 'sm' | 'md' | 'lg'; }
export declare const Button: React.FC<ButtonProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.match(out, /size\?: \[sm, md, lg\]/);
});

test('renderFact emits function-type props as quoted strings', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface InputProps { onChange?: (v: string) => void; }
export declare const Input: React.FC<InputProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.match(out, /onChange\?: "\(v: string\) => void"/);
});

test('renderFact normalizes boolean to bool and React.ReactNode to ReactNode', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
import * as React from 'react';
export interface CardProps { hoverable?: boolean; children: React.ReactNode; }
export declare const Card: React.FC<CardProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.match(out, /hoverable\?: bool/);
  assert.match(out, /children: ReactNode/);
  assert.ok(!/hoverable\?: boolean/.test(out));
  assert.ok(!/children: React\.ReactNode/.test(out));
});

test('renderFact emits spreads as a YAML list', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
import * as React from 'react';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { variant?: 'info' | 'error'; }
export declare const Badge: React.FC<BadgeProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.match(out, /spreads: \[/);
  assert.ok(!/  \.\.\.React\.HTMLAttributes/.test(out));
});

test('renderFact required prop emits with no `?` suffix', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface ItemProps { value: string; label?: string; }
export declare const Item: React.FC<ItemProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  assert.match(out, /  value: string/);
  assert.match(out, /  label\?: string/);
});

test('renderFact emits tokens without bullet prefix', () => {
  const out = extractor.renderFact([], ['--color-primary', '--color-bg', '.text-h1']);
  assert.match(out, /^--color-primary$/m);
  assert.match(out, /^\.text-h1$/m);
  assert.ok(!/^- --color-primary/m.test(out));
});

test('dedupeComponents keeps first-listed and warns on collisions', () => {
  const a = { name: 'Button', pkg: '@org/a', position: 0, ctx: {} as any };
  const b = { name: 'Button', pkg: '@org/b', position: 0, ctx: {} as any };
  const c = { name: 'Card', pkg: '@org/a', position: 0, ctx: {} as any };
  const warnings: string[] = [];
  const out = extractor.dedupeComponents([a, b, c], msg => warnings.push(msg));
  assert.equal(out.length, 2);
  assert.equal(out[0].pkg, '@org/a');
  assert.equal(out[0].name, 'Button');
  assert.equal(out[1].name, 'Card');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Button.*@org\/a.*@org\/b/);
});

test('dedupeComponents subsumes a flat name under a same-package dotted compound', () => {
  // Intra-library: a library that exports both `ActionList.Item` (compound)
  // and a flattened `ActionListItem` alias collapses to the dotted form.
  const dotted = { name: 'ActionList.Item', pkg: '@org/a', position: 0, ctx: {} as any };
  const flat = { name: 'ActionListItem', pkg: '@org/a', position: 1, propsInterface: {} as any, ctx: {} as any };
  const out = extractor.dedupeComponents([dotted, flat], () => {});
  assert.deepEqual(out.map(c => c.name), ['ActionList.Item']);
  assert.ok(out[0].propsInterface, 'props should transfer from flat to dotted');
});

test('dedupeComponents does not subsume a flat name across packages', () => {
  // Field-test gap (Phase 7 / MUI+Mantine multi-types): one library exports the
  // flat `AvatarGroup` while another exports the compound `Avatar.Group`. These
  // are distinct components from distinct packages; the intra-library flat/dotted
  // subsumption must not silently delete the flat one.
  const flat = { name: 'AvatarGroup', pkg: '@mui/material', position: 0, ctx: {} as any };
  const dotted = { name: 'Avatar.Group', pkg: '@mantine/core', position: 1, ctx: {} as any };
  const out = extractor.dedupeComponents([flat, dotted], () => {});
  assert.deepEqual(out.map(c => c.name).sort(), ['Avatar.Group', 'AvatarGroup']);
});

test('renderFact wraps components in a fenced yaml block', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface AvatarProps { size?: 'sm' | 'md'; }
export declare const Avatar: React.FC<AvatarProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  const fenceOpen = out.indexOf('```yaml');
  const fenceClose = out.indexOf('```', fenceOpen + 1);
  assert.ok(fenceOpen >= 0, 'expected ```yaml fence open');
  assert.ok(fenceClose > fenceOpen, 'expected matching ``` close');
  assert.ok(out.indexOf('Avatar:') > fenceOpen);
  assert.ok(out.indexOf('Avatar:') < fenceClose);
});

test('main exits 1 with actionable message when config is missing', async () => {
  const cwd = await mktempCwd({});
  const { status, stderr } = runMain(cwd);
  assert.equal(status, 1);
  assert.match(stderr, /pastiche\/config\.yaml not found/);
  assert.match(stderr, /\/pastiche-init/);
});

test('main writes FACT.md to pastiche/FACT.md on success', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens:
  - styles/theme.css
`,
    'dist/index.d.ts': `
export interface ButtonProps { size?: 'sm' | 'md'; }
export declare const Button: React.FC<ButtonProps>;
`,
    'styles/theme.css': `:root { --color-primary: red; }`,
  });
  const { status, stdout, stderr } = runMain(cwd);
  assert.equal(status, 0, `expected exit 0, stderr was: ${stderr}`);
  const fact = await fsp.readFile(path.join(cwd, 'pastiche/FACT.md'), 'utf8');
  assert.match(fact, /^Button:/m);
  assert.match(fact, /pkg: "@org\/web"/);
  assert.match(fact, /size\?: \[sm, md\]/);
  assert.match(fact, /^--color-primary$/m);
  assert.match(stdout, /pastiche\/FACT\.md/);
});

test('e2e: source_dir fixture produces correct FACT.md', () => {
  const fixtureRoot = path.resolve(
    fileURLToPath(new URL('.', import.meta.url)),
    '__fixtures__',
    'source-walk',
  );
  const { status, stderr } = runMain(fixtureRoot);
  assert.equal(status, 0, `extractor failed: ${stderr}`);
  const fact = fs.readFileSync(path.join(fixtureRoot, 'pastiche/FACT.md'), 'utf8');

  // Header banners
  assert.match(fact, /^<!-- AUTO-GENERATED/m);

  // Components fence
  assert.match(fact, /## Components\n\n```yaml/);

  // Button: walked, sidecar excluded, all format details
  assert.match(fact, /^Button:$/m);
  assert.match(fact, /^  pkg: "ui"$/m);
  assert.match(fact, /^  size\?: \[sm, md, lg\]$/m);
  assert.match(fact, /^  variant\?: \[primary, secondary\]$/m);
  assert.match(fact, /^  disabled\?: bool$/m);
  assert.match(fact, /^  onClick\?: "\(e: .*MouseEvent\) => void"$/m);
  assert.match(fact, /^  children: ReactNode$/m);

  // Card: spreads list
  assert.match(fact, /^Card:$/m);
  assert.match(fact, /^  spreads: \[/m);
  assert.match(fact, /^  hoverable\?: bool$/m);

  // TestButton (from button.test.tsx) must NOT appear
  assert.ok(!/TestButton:/.test(fact), 'TestButton from sidecar leaked into FACT.md');

  // Accordion: discriminated union is flattened to an inline union (union flattening, 349aeaa)
  assert.match(fact, /^Accordion:$/m);
  assert.match(fact, /^  type: \[single, multiple\]$/m);
  assert.match(fact, /^  value\?: string$/m);
  assert.match(fact, /^  onValueChange\?: "\(v: string\) => void"$/m);

  // Tokens: all three CSS shapes, no bullet prefix
  assert.match(fact, /^--color-primary$/m);
  assert.match(fact, /^--color-bg$/m);
  assert.match(fact, /^--color-fg$/m);
  assert.match(fact, /^\.text-h1$/m);
  assert.ok(!/^- --color-primary/m.test(fact), 'tokens have bullet prefix');

  // Cleanup
  fs.rmSync(path.join(fixtureRoot, 'pastiche/FACT.md'));
});

test('renderFact emits flow arrays for unions containing null/undefined members (cva-style)', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export interface BadgeProps {
  size?: 'sm' | 'md' | null | undefined;
  variant?: 'primary' | 'secondary' | null;
}
export declare const Badge: React.FC<BadgeProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(cfg.packages[0], packageSources.get('@org/web')!);
  const out = extractor.renderFact(comps, []);
  // Should be flow arrays of barewords, NOT escaped pipe-union strings.
  assert.match(out, /size\?: \[sm, md\]/);
  assert.match(out, /variant\?: \[primary, secondary\]/);
  // Negative: pipe-union form must not leak through.
  assert.ok(!/"sm" \| "md"/.test(out), 'pipe-union form leaked through');
});

// ---------------------------------------------------------------------------
// Re-export resolution (types mode)
// ---------------------------------------------------------------------------

test('buildProject resolves re-exports in types mode', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export * from './Button';
export * from './Card';
`,
    'dist/Button.d.ts': `
export interface ButtonProps { size?: 'sm' | 'md'; }
export declare const Button: React.FC<ButtonProps>;
`,
    'dist/Card.d.ts': `
export interface CardProps { hoverable?: boolean; }
export declare const Card: React.FC<CardProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const sources = packageSources.get('@org/web')!;
  assert.equal(sources.length, 3);
});

test('buildProject resolves nested re-exports transitively', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: pkg
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `export * from './components';`,
    'dist/components.d.ts': `export * from './Button';`,
    'dist/Button.d.ts': `
export interface ButtonProps { size?: 'sm'; }
export declare const Button: React.FC<ButtonProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  assert.equal(packageSources.get('pkg')!.length, 3);
});

test('buildProject skips non-relative re-exports', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: pkg
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export * from './Button';
export { something } from 'external-package';
`,
    'dist/Button.d.ts': `
export interface ButtonProps {}
export declare const Button: React.FC<ButtonProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  assert.equal(packageSources.get('pkg')!.length, 2);
});

test('buildProject handles circular re-exports without looping', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: pkg
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `export * from './a';`,
    'dist/a.d.ts': `
export * from './b';
export declare const A: React.FC;
`,
    'dist/b.d.ts': `
export * from './a';
export declare const B: React.FC;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  assert.equal(packageSources.get('pkg')!.length, 3);
});

test('discoverComponentsForPackage finds props in re-exported .d.ts files', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export * from './Button';
export * from './Card';
`,
    'dist/Button.d.ts': `
export interface ButtonProps { size?: 'sm' | 'md'; disabled?: boolean; }
export declare const Button: React.FC<ButtonProps>;
`,
    'dist/Card.d.ts': `
export interface CardProps { hoverable?: boolean; }
export declare const Card: React.FC<CardProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const rawComps = extractor.discoverComponentsForPackage(
    cfg.packages[0],
    packageSources.get('@org/web')!,
  );
  const comps = extractor.dedupeComponents(rawComps, () => {});
  const names = comps.map(c => c.name).sort();
  assert.deepEqual(names, ['Button', 'Card']);
  const button = comps.find(c => c.name === 'Button')!;
  assert.ok(button.propsInterface || button.propsTypeNode, 'ButtonProps should be resolved');
});

test('renderFact renders props from re-exported .d.ts files', async () => {
  const cwd = await mktempCwd({
    'pastiche/config.yaml': `
platform: claude-code
packages:
  - name: "@org/web"
    types: dist/index.d.ts
tokens: []
`,
    'dist/index.d.ts': `
export * from './Button';
export * from './Card';
`,
    'dist/Button.d.ts': `
export interface ButtonProps { size?: 'sm' | 'md'; disabled?: boolean; }
export declare const Button: React.FC<ButtonProps>;
`,
    'dist/Card.d.ts': `
export interface CardProps { hoverable?: boolean; }
export declare const Card: React.FC<CardProps>;
`,
  });
  const cfg = extractor.loadConfig(cwd);
  const { packageSources } = extractor.buildProject(cfg, cwd);
  const comps = extractor.discoverComponentsForPackage(
    cfg.packages[0],
    packageSources.get('@org/web')!,
  );
  const out = extractor.renderFact(comps, []);
  assert.match(out, /^Button:$/m);
  assert.match(out, /size\?: \[sm, md\]/);
  assert.match(out, /disabled\?: bool/);
  assert.match(out, /^Card:$/m);
  assert.match(out, /hoverable\?: bool/);
});
