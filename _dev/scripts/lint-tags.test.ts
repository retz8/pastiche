/**
 * Pastiche lint tests (spec §14.2). Run via:
 *   pnpm pastiche:lint:test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFact, lintWisdom, lintKnowledge } from './lint-tags.ts';

const FIXTURE_FACT = `
### [Button]
package: @umichkisa-ds/web

### [IconButton]
package: @umichkisa-ds/web

### [Form.Input]
package: @umichkisa-ds/form

## Tokens

- --color-brand-primary
- --color-foreground
- .type-display
- .type-h1
- .ds-spinner
`;

test('parseFact extracts components and tokens', () => {
  const fact = parseFact(FIXTURE_FACT);
  assert.ok(fact.components.has('Button'));
  assert.ok(fact.components.has('IconButton'));
  assert.ok(fact.components.has('Form.Input'));
  assert.ok(fact.tokens.has('--color-brand-primary'));
  assert.ok(fact.tokens.has('.type-display'));
  assert.ok(fact.tokens.has('.ds-spinner'));
  assert.equal(fact.components.size, 3);
  assert.equal(fact.tokens.size, 5);
});

test('WISDOM: valid tags pass', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `
- [Button] Default type is "button".
- [Button][IconButton] Dual-ring focus.
- [GENERAL] No dark mode.
- [--color-brand-primary] Pairs with foreground.
- [.type-display][.type-h1] Use tracking-tight.
`;
  assert.deepEqual(lintWisdom(wisdom, fact).violations, []);
});

test('WISDOM: unknown tag fails', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `
- [Button] ok.
- [Modal] stale tag from removed component.
`;
  const { violations: v } = lintWisdom(wisdom, fact);
  assert.equal(v.length, 1);
  assert.match(v[0].message, /unknown tag \[Modal\]/);
  assert.equal(v[0].line, 3);
});

test('WISDOM: bad token spelling fails', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `- [color-brand-primary] missing -- prefix.`;
  const { violations: v } = lintWisdom(wisdom, fact);
  assert.equal(v.length, 1);
  assert.match(v[0].message, /color-brand-primary/);
});

test('WISDOM: HTML comments ignored', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `<!-- example: [Foo][Bar] -->\n- [Button] ok.`;
  assert.deepEqual(lintWisdom(wisdom, fact).violations, []);
});

test('WISDOM: bracket-shaped Tailwind values inside code-spans are not tags', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `- [Button] never use \`px-[24px]\` or \`mt-[13px]\`.`;
  assert.deepEqual(lintWisdom(wisdom, fact).violations, []);
});

test('KNOWLEDGE: valid component recommendations pass', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `
### Primary action
→ \`Button variant="primary"\`

### Icon-only action
→ \`IconButton\` with \`aria-label\`

### Single-line text input
→ \`Form.Input\`
`;
  assert.deepEqual(lintKnowledge(knowledge, fact).violations, []);
});

test('KNOWLEDGE: unknown component fails', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `→ \`Modal variant="alert"\``;
  const { violations: v } = lintKnowledge(knowledge, fact);
  assert.equal(v.length, 1);
  assert.match(v[0].message, /unknown component `Modal`/);
});

test('KNOWLEDGE: unknown token fails', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `Use \`--color-brand-typo\` here.`;
  const { violations: v } = lintKnowledge(knowledge, fact);
  assert.equal(v.length, 1);
  assert.match(v[0].message, /unknown token/);
});

test('KNOWLEDGE: Tailwind utilities and prop strings ignored', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `
Use \`gap-2\`, \`rounded-md\`, \`flex items-center\`, \`text-foreground\`, \`hover:underline\` —
all framework defaults or KISA Tailwind utilities (out of scope for v1 lint).
Also \`aria-label\`, \`md:\`, \`type="submit"\` are not atoms.
`;
  assert.deepEqual(lintKnowledge(knowledge, fact).violations, []);
});

test('LintReport.checked: WISDOM counts tags, separates [GENERAL]', () => {
  const fact = parseFact(FIXTURE_FACT);
  const wisdom = `
- [Button][IconButton] paired rule.
- [GENERAL] system rule.
- [--color-brand-primary] token rule.
`;
  const r = lintWisdom(wisdom, fact);
  assert.equal(r.checked.tags, 4);
  assert.equal(r.checked.general, 1);
  assert.equal(r.checked['fact-bound'], 3);
});

test('LintReport.checked: KNOWLEDGE separates component / token / ignored spans', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `
→ \`Button variant="primary"\`, also \`gap-2\`, \`--color-foreground\`, \`flex items-center\`.
`;
  const r = lintKnowledge(knowledge, fact);
  assert.equal(r.checked['code-spans'], 4);
  assert.equal(r.checked['component-refs'], 1);
  assert.equal(r.checked['token-refs'], 1);
  assert.equal(r.checked.ignored, 2);
});

test('KNOWLEDGE: Form.X namespace resolves', () => {
  const fact = parseFact(FIXTURE_FACT);
  const knowledge = `→ \`Form.Input\` and also \`Form.Missing\``;
  const { violations: v } = lintKnowledge(knowledge, fact);
  assert.equal(v.length, 1);
  assert.match(v[0].message, /Form\.Missing/);
});
