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
