/**
 * Pastiche cross-doc tag-sanity lint (spec §14.2).
 *
 * FACT.md is the single source of truth. This script verifies:
 *   - WISDOM.md: every [tag] resolves to a FACT atom or is the [GENERAL]
 *     allow-listed system-wide marker.
 *   - KNOWLEDGE.md: every PascalCase component code-span (incl. `Form.Foo`
 *     namespace) and every `--*` / `.type-*` / `.ds-*` token code-span
 *     resolves to a FACT atom.
 *
 * Tailwind-default and arbitrary utility code-spans in KNOWLEDGE are ignored
 * by design (spec §11 lightness; see `_handoff-to-3b.md` open issue on a
 * future `useTailwindV4` flag).
 *
 * Fails closed with a line-numbered error per offence.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(REPO_ROOT, 'pastiche');

const ALLOW_LISTED_TAGS = new Set(['GENERAL']);

/**
 * Canonical KNOWLEDGE.md sections (spec §3.2 + Idea-4 redesign).
 * Every KNOWLEDGE.md must declare these as H2 sections (may be empty stubs).
 * Projects may add further H2 sections beyond the canonical 12.
 */
const CANONICAL_KNOWLEDGE_SECTIONS = [
  'Index',
  'Action buttons',
  'Forms & input collection',
  'Feedback & status',
  'Overlays',
  'Navigation & wayfinding',
  'Content display',
  'Layout & page structure',
  'Date & time selection',
  'Iconography',
  'Visual hierarchy',
  'Domain-specific patterns',
  'Brand Identity',
];

export interface FactAtoms {
  components: Set<string>;
  tokens: Set<string>;
}

export interface LintViolation {
  file: string;
  line: number;
  message: string;
}

export interface LintReport {
  violations: LintViolation[];
  // Counts of items inspected (not just violations) — for the summary line.
  checked: Record<string, number>;
}

// ---------------------------------------------------------------------------
// FACT parsing
// ---------------------------------------------------------------------------

export function parseFact(text: string): FactAtoms {
  const components = new Set<string>();
  const tokens = new Set<string>();
  let inTokens = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## Tokens')) { inTokens = true; continue; }
    if (line.startsWith('## ') && !line.startsWith('## Tokens')) inTokens = false;
    const compMatch = line.match(/^### \[([^\]]+)\]/);
    if (compMatch) { components.add(compMatch[1]); continue; }
    if (inTokens) {
      const tokMatch = line.match(/^- (\S+)/);
      if (tokMatch) tokens.add(tokMatch[1]);
    }
  }
  return { components, tokens };
}

// ---------------------------------------------------------------------------
// WISDOM check
// ---------------------------------------------------------------------------

export function lintWisdom(text: string, fact: FactAtoms, file = 'WISDOM.md'): LintReport {
  const violations: LintViolation[] = [];
  const valid = new Set([...fact.components, ...fact.tokens]);
  const lines = text.split('\n');
  let totalTags = 0;
  let generalTags = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('<!--')) continue; // skip preamble comments
    // Strip backtick code-spans first — bracket-shaped Tailwind arbitrary
    // values like `px-[24px]` are prose, not tags.
    const stripped = line.replace(/`[^`]*`/g, '');
    // Match [Foo], [--color-bar], [.type-baz]; allow concatenated [A][B][C].
    const tagRegex = /\[([A-Za-z0-9_.\-]+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(stripped)) !== null) {
      const tag = m[1];
      totalTags++;
      if (ALLOW_LISTED_TAGS.has(tag)) { generalTags++; continue; }
      if (!valid.has(tag)) {
        violations.push({
          file,
          line: i + 1,
          message: `unknown tag [${tag}] — not in FACT.md`,
        });
      }
    }
  }
  return {
    violations,
    checked: {
      tags: totalTags,
      general: generalTags,
      'fact-bound': totalTags - generalTags,
    },
  };
}

// ---------------------------------------------------------------------------
// KNOWLEDGE check
// ---------------------------------------------------------------------------

const COMPONENT_HEAD = /^([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)\b/;
const TOKEN_SHAPE = /^(--[A-Za-z0-9-]+|\.(?:type|ds)-[A-Za-z0-9-]+)$/;

export function lintKnowledge(text: string, fact: FactAtoms, file = 'KNOWLEDGE.md'): LintReport {
  const violations: LintViolation[] = [];
  const lines = text.split('\n');
  let totalSpans = 0;
  let componentRefs = 0;
  let tokenRefs = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('<!--')) continue;
    const codeSpanRegex = /`([^`]+)`/g;
    let m: RegExpExecArray | null;
    while ((m = codeSpanRegex.exec(line)) !== null) {
      const span = m[1].trim();
      totalSpans++;
      // Token shape — must resolve verbatim.
      if (TOKEN_SHAPE.test(span)) {
        tokenRefs++;
        if (!fact.tokens.has(span)) {
          violations.push({
            file,
            line: i + 1,
            message: `unknown token \`${span}\` — not in FACT.md`,
          });
        }
        continue;
      }
      // Component shape — first PascalCase head (incl. `Form.Foo`) must resolve.
      const head = span.match(COMPONENT_HEAD);
      if (head) {
        componentRefs++;
        const name = head[1];
        if (!fact.components.has(name)) {
          violations.push({
            file,
            line: i + 1,
            message: `unknown component \`${name}\` (in \`${span}\`) — not in FACT.md`,
          });
        }
      }
      // Anything else (Tailwind utilities, JSX prop strings, raw HTML) is
      // out of scope for v1 — silently ignored.
    }
  }
  return {
    violations,
    checked: {
      'code-spans': totalSpans,
      'component-refs': componentRefs,
      'token-refs': tokenRefs,
      ignored: totalSpans - componentRefs - tokenRefs,
    },
  };
}

// ---------------------------------------------------------------------------
// KNOWLEDGE canonical-sections check
// ---------------------------------------------------------------------------

/**
 * Verify every canonical section name appears as an H2 (`## <name>`) in
 * KNOWLEDGE.md. Section bodies may be empty stubs; presence is what matters.
 * Extra sections beyond the canonical 12 are allowed and not flagged.
 */
export function lintKnowledgeSections(
  text: string,
  file = 'KNOWLEDGE.md',
): LintReport {
  const violations: LintViolation[] = [];
  const lines = text.split('\n');
  const present = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## (.+?)\s*$/);
    if (m) present.set(m[1].trim(), i + 1);
  }
  for (const required of CANONICAL_KNOWLEDGE_SECTIONS) {
    if (!present.has(required)) {
      violations.push({
        file,
        line: 1,
        message: `missing canonical section: "## ${required}" (may be an empty stub)`,
      });
    }
  }
  return {
    violations,
    checked: {
      'canonical-required': CANONICAL_KNOWLEDGE_SECTIONS.length,
      'canonical-found': CANONICAL_KNOWLEDGE_SECTIONS.length - violations.length,
      'h2-total': present.size,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

function main(): void {
  const fact = parseFact(fs.readFileSync(path.join(DOCS, 'FACT.md'), 'utf8'));
  const wisdom = fs.readFileSync(path.join(DOCS, 'WISDOM.md'), 'utf8');
  const knowledge = fs.readFileSync(path.join(DOCS, 'KNOWLEDGE.md'), 'utf8');

  const wisdomReport = lintWisdom(wisdom, fact);
  const knowledgeReport = lintKnowledge(knowledge, fact);
  const sectionsReport = lintKnowledgeSections(knowledge);
  const violations = [
    ...wisdomReport.violations,
    ...knowledgeReport.violations,
    ...sectionsReport.violations,
  ];

  // Always print the summary block first — descriptive even on success.
  console.log('pastiche:lint — cross-doc tag-sanity');
  console.log('');
  console.log(`  FACT.md       ${fact.components.size} components, ${fact.tokens.size} tokens (source of truth)`);
  console.log(
    `  WISDOM.md     ${wisdomReport.checked.tags} tag(s) checked ` +
      `→ ${wisdomReport.checked['fact-bound']} FACT-bound, ` +
      `${wisdomReport.checked.general} [GENERAL]; ` +
      `${wisdomReport.violations.length} violation(s)`,
  );
  console.log(
    `  KNOWLEDGE.md  ${knowledgeReport.checked['code-spans']} code-span(s) scanned ` +
      `→ ${knowledgeReport.checked['component-refs']} component ref(s), ` +
      `${knowledgeReport.checked['token-refs']} token ref(s), ` +
      `${knowledgeReport.checked.ignored} ignored (Tailwind/prop/prose); ` +
      `${knowledgeReport.violations.length} violation(s)`,
  );
  console.log(
    `  KNOWLEDGE.md  ${sectionsReport.checked['canonical-found']}/${sectionsReport.checked['canonical-required']} canonical section(s) present ` +
      `(${sectionsReport.checked['h2-total']} H2(s) total); ` +
      `${sectionsReport.violations.length} violation(s)`,
  );
  console.log('');

  if (violations.length === 0) {
    console.log('pastiche:lint OK — 0 violations.');
    return;
  }

  console.error('Violations:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} ${v.message}`);
  }
  console.error(`\npastiche:lint FAILED — ${violations.length} violation(s).`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
