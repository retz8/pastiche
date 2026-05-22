import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { readDocs, type Violation } from './lint.ts';

function mkTempProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pastiche-lint-test-'));
}

function write(cwd: string, rel: string, content: string): void {
  const full = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

test('readDocs returns sentinels for all four missing files', () => {
  const cwd = mkTempProject();
  const { configRaw, factRaw, knowledgeRaw, wisdomRaw, sentinels } = readDocs(cwd);
  assert.equal(configRaw, null);
  assert.equal(factRaw, null);
  assert.equal(knowledgeRaw, null);
  assert.equal(wisdomRaw, null);
  assert.equal(sentinels.length, 4);
  const files = sentinels.map((v: Violation) => v.file).sort();
  assert.deepEqual(files, [
    'pastiche/FACT.md',
    'pastiche/KNOWLEDGE.md',
    'pastiche/WISDOM.md',
    'pastiche/config.yaml',
  ]);
  for (const v of sentinels) {
    assert.equal(v.family, 'sentinel');
    assert.equal(v.line, 1);
    assert.match(v.message, /not found.*run \/pastiche-init/);
  }
});

test('readDocs loads contents and emits zero sentinels when all four files exist', () => {
  const cwd = mkTempProject();
  write(cwd, 'pastiche/config.yaml', 'platform: claude-code\n');
  write(cwd, 'pastiche/FACT.md', '## Components\n\n```yaml\n```\n\n## Tokens\n');
  write(cwd, 'pastiche/KNOWLEDGE.md', '## Action buttons\n');
  write(cwd, 'pastiche/WISDOM.md', '');
  const { configRaw, factRaw, knowledgeRaw, wisdomRaw, sentinels } = readDocs(cwd);
  assert.equal(configRaw, 'platform: claude-code\n');
  assert.equal(factRaw, '## Components\n\n```yaml\n```\n\n## Tokens\n');
  assert.equal(knowledgeRaw, '## Action buttons\n');
  assert.equal(wisdomRaw, '');
  assert.equal(sentinels.length, 0);
});

test('readDocs emits sentinel only for the missing file when others exist', () => {
  const cwd = mkTempProject();
  write(cwd, 'pastiche/config.yaml', 'platform: claude-code\n');
  write(cwd, 'pastiche/KNOWLEDGE.md', '');
  write(cwd, 'pastiche/WISDOM.md', '');
  // FACT.md intentionally absent.
  const { factRaw, sentinels } = readDocs(cwd);
  assert.equal(factRaw, null);
  assert.equal(sentinels.length, 1);
  assert.equal(sentinels[0].file, 'pastiche/FACT.md');
});

import { validateConfig } from './lint.ts';

const VALID_CONFIG = `
platform: claude-code
packages:
  - name: "@org/web"
    types: "node_modules/@org/web/dist/index.d.ts"
tokens:
  - "src/styles/tokens.css"
design_md_reference: null
typecheck_command: "tsc --noEmit"
setup_progress:
  action-buttons: stub
  forms-input-collection: stub
  feedback-status: stub
  overlays: stub
  navigation-wayfinding: stub
  content-display: stub
  layout-page-structure: stub
  date-time-selection: stub
  iconography: stub
  visual-hierarchy: stub
  domain-specific-patterns: stub
  brand-identity: stub
  general-wisdom: stub
`;

test('validateConfig: valid config produces zero violations', () => {
  const r = validateConfig(VALID_CONFIG);
  assert.deepEqual(r.violations, []);
  assert.equal(r.config?.platform, 'claude-code');
});

test('validateConfig: malformed YAML produces a single config violation, config=null', () => {
  const r = validateConfig('platform: claude-code\n  bad: indent: here\n');
  assert.equal(r.config, null);
  assert.equal(r.violations.length, 1);
  assert.equal(r.violations[0].family, 'config');
  assert.match(r.violations[0].message, /YAML parse error/);
});

test('validateConfig: null platform → sentinel', () => {
  const r = validateConfig(VALID_CONFIG.replace('platform: claude-code', 'platform: null'));
  const sentinels = r.violations.filter((v) => v.family === 'sentinel');
  assert.equal(sentinels.length, 1);
  assert.match(sentinels[0].message, /platform not set/);
});

test('validateConfig: null typecheck_command → sentinel', () => {
  const r = validateConfig(
    VALID_CONFIG.replace('typecheck_command: "tsc --noEmit"', 'typecheck_command: null'),
  );
  const sentinels = r.violations.filter((v) => v.family === 'sentinel');
  assert.equal(sentinels.length, 1);
  assert.match(sentinels[0].message, /typecheck_command not set/);
});

test('validateConfig: both packages and tokens empty → sentinel', () => {
  const r = validateConfig(`
platform: claude-code
packages: []
tokens: []
design_md_reference: null
typecheck_command: "tsc"
setup_progress:
  action-buttons: stub
  forms-input-collection: stub
  feedback-status: stub
  overlays: stub
  navigation-wayfinding: stub
  content-display: stub
  layout-page-structure: stub
  date-time-selection: stub
  iconography: stub
  visual-hierarchy: stub
  domain-specific-patterns: stub
  brand-identity: stub
  general-wisdom: stub
`);
  const sentinels = r.violations.filter((v) => v.family === 'sentinel');
  assert.ok(sentinels.some((v) => /declare at least one packages entry or one tokens file/.test(v.message)));
});

test('validateConfig: packages alone non-empty is fine (tokens empty)', () => {
  const r = validateConfig(VALID_CONFIG.replace('tokens:\n  - "src/styles/tokens.css"', 'tokens: []'));
  assert.deepEqual(r.violations, []);
});

test('validateConfig: tokens alone non-empty is fine (packages empty)', () => {
  const r = validateConfig(VALID_CONFIG.replace(
    'packages:\n  - name: "@org/web"\n    types: "node_modules/@org/web/dist/index.d.ts"',
    'packages: []',
  ));
  assert.deepEqual(r.violations, []);
});

test('validateConfig: platform with unknown value → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace('platform: claude-code', 'platform: vscode'));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.equal(cfg.length, 1);
  assert.match(cfg[0].message, /platform must be one of: claude-code, codex/);
});

test('validateConfig: package missing name → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace(
    '  - name: "@org/web"\n    types: "node_modules/@org/web/dist/index.d.ts"',
    '  - types: "node_modules/@org/web/dist/index.d.ts"',
  ));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /packages\[0\].name/.test(v.message)));
});

test('validateConfig: duplicate package names → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace(
    '  - name: "@org/web"\n    types: "node_modules/@org/web/dist/index.d.ts"',
    '  - name: "@org/web"\n    types: "a.d.ts"\n  - name: "@org/web"\n    types: "b.d.ts"',
  ));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /duplicate package name/.test(v.message)));
});

test('validateConfig: package with both types and source_dir → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace(
    '  - name: "@org/web"\n    types: "node_modules/@org/web/dist/index.d.ts"',
    '  - name: "@org/web"\n    types: "a.d.ts"\n    source_dir: "src/components"',
  ));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /exactly one of types or source_dir/.test(v.message)));
});

test('validateConfig: package with neither types nor source_dir → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace(
    '  - name: "@org/web"\n    types: "node_modules/@org/web/dist/index.d.ts"',
    '  - name: "@org/web"',
  ));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /exactly one of types or source_dir/.test(v.message)));
});

test('validateConfig: setup_progress missing a required key → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace('  general-wisdom: stub\n', ''));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /setup_progress.*general-wisdom/.test(v.message)));
});

test('validateConfig: setup_progress value with unknown enum → schema violation', () => {
  const r = validateConfig(VALID_CONFIG.replace('action-buttons: stub', 'action-buttons: maybe'));
  const cfg = r.violations.filter((v) => v.family === 'config');
  assert.ok(cfg.some((v) => /setup_progress\.action-buttons.*one of: stub, done/.test(v.message)));
});

import { parseAndValidateFact } from './lint.ts';

const VALID_FACT = `<!-- AUTO-GENERATED by the Pastiche FACT extractor. Do not edit by hand. -->

## Components

\`\`\`yaml
Button:
  pkg: "@org/web"
  variant?: [primary, secondary]
IconButton:
  pkg: "@org/web"
Form.Input:
  pkg: "@org/form"
  name: string
Avatar: { pkg: "@org/x" }
\`\`\`

## Tokens

--color-brand-primary
--color-foreground
.type-display
`;

test('parseAndValidateFact: valid FACT — atoms and tokens extracted, zero violations', () => {
  const r = parseAndValidateFact(VALID_FACT);
  assert.deepEqual(r.violations, []);
  assert.deepEqual(
    [...r.atoms.components].sort(),
    ['Avatar', 'Button', 'Form.Input', 'IconButton'].sort(),
  );
  assert.deepEqual(
    [...r.atoms.tokens].sort(),
    ['--color-brand-primary', '--color-foreground', '.type-display'].sort(),
  );
});

test('parseAndValidateFact: missing ## Components H2 → violation', () => {
  const bad = VALID_FACT.replace('## Components\n', '');
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /missing.*## Components/i.test(v.message)));
});

test('parseAndValidateFact: missing ## Tokens H2 → violation', () => {
  const bad = VALID_FACT.replace('## Tokens', '## Other');
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /missing.*## Tokens/i.test(v.message)));
});

test('parseAndValidateFact: missing fenced yaml block under Components → violation', () => {
  const bad = `## Components

(no fence here)

## Tokens

--foo
`;
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /fenced.*yaml/i.test(v.message)));
});

test('parseAndValidateFact: unclosed fenced block → violation', () => {
  const bad = `## Components

\`\`\`yaml
Button:
  pkg: "@org/web"

## Tokens
`;
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /unclosed.*fence/i.test(v.message)));
});

test('parseAndValidateFact: column-0 line inside components block not matching atom-name shape → violation', () => {
  const bad = VALID_FACT.replace(
    'Form.Input:',
    'stray prose here\nForm.Input:',
  );
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /column-0.*atom-name shape|invalid line/i.test(v.message)));
});

test('parseAndValidateFact: duplicate atom name → violation', () => {
  const bad = VALID_FACT.replace(
    'IconButton:\n  pkg: "@org/web"',
    'IconButton:\n  pkg: "@org/web"\nButton:\n  pkg: "@org/web"',
  );
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /duplicate atom.*Button/.test(v.message)));
});

test('parseAndValidateFact: token line with leading whitespace → violation', () => {
  const bad = VALID_FACT.replace('--color-brand-primary', '  --color-brand-primary');
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /leading whitespace/.test(v.message)));
});

test('parseAndValidateFact: token line with "- " bullet prefix → violation', () => {
  const bad = VALID_FACT.replace('--color-brand-primary', '- --color-brand-primary');
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /bullet prefix/.test(v.message)));
});

test('parseAndValidateFact: duplicate token → violation', () => {
  const bad = VALID_FACT.replace('--color-foreground', '--color-brand-primary');
  const r = parseAndValidateFact(bad);
  assert.ok(r.violations.some((v) => /duplicate token.*--color-brand-primary/.test(v.message)));
});

test('parseAndValidateFact: lenient atom-name shape accepts lowercase + Form.X', () => {
  const t = `## Components

\`\`\`yaml
lowercase_atom:
  pkg: "@org/x"
Form.Input:
  pkg: "@org/x"
MDX_Heading:
  pkg: "@org/x"
\`\`\`

## Tokens

--foo
`;
  const r = parseAndValidateFact(t);
  assert.deepEqual(r.violations, []);
  assert.ok(r.atoms.components.has('lowercase_atom'));
  assert.ok(r.atoms.components.has('Form.Input'));
  assert.ok(r.atoms.components.has('MDX_Heading'));
});
