/**
 * Pastiche lint — v1 fail-closed checkpoint.
 *
 * Reads ./pastiche/{config.yaml,FACT.md,KNOWLEDGE.md,WISDOM.md} from the
 * current working directory and validates them against five check families:
 *   1. Sentinels      — files exist, required config fields non-null,
 *                       packages-or-tokens non-empty, FACT has atoms.
 *   2. Config schema  — non-null fields match declared shapes.
 *   3. FACT schema    — H2 anchors, fenced yaml block, column-0 atom-name
 *                       shape, token-line shape, no duplicates. Grep-style;
 *                       mirrors the implementer agents' `^Atom:` contract.
 *   4. WISDOM tags    — every `[A,B,C]` group well-formed; tags resolve to
 *                       FACT atoms or `[GENERAL]`.
 *   5. KNOWLEDGE      — backticked spans resolve; all 12 canonical H2s present.
 *
 * Locked decisions: docs/spec/task-4.2-lint.md.
 * Operates entirely on CWD; plugin install location is opaque to this script.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ViolationFamily =
  | 'sentinel'
  | 'config'
  | 'fact'
  | 'wisdom'
  | 'knowledge';

export interface Violation {
  family: ViolationFamily;
  /** Adopter-relative path like 'pastiche/FACT.md'. */
  file: string;
  /** 1-indexed line. Whole-file errors use 1. */
  line: number;
  message: string;
}

export interface ReadDocsResult {
  configRaw: string | null;
  factRaw: string | null;
  knowledgeRaw: string | null;
  wisdomRaw: string | null;
  sentinels: Violation[];
}

// ---------------------------------------------------------------------------
// readDocs — file loading + missing-file sentinels
// ---------------------------------------------------------------------------

const DOC_REL_PATHS = {
  config: 'pastiche/config.yaml',
  fact: 'pastiche/FACT.md',
  knowledge: 'pastiche/KNOWLEDGE.md',
  wisdom: 'pastiche/WISDOM.md',
} as const;

function readIfExists(cwd: string, rel: string): string | null {
  const full = path.join(cwd, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

export function readDocs(cwd: string): ReadDocsResult {
  const configRaw = readIfExists(cwd, DOC_REL_PATHS.config);
  const factRaw = readIfExists(cwd, DOC_REL_PATHS.fact);
  const knowledgeRaw = readIfExists(cwd, DOC_REL_PATHS.knowledge);
  const wisdomRaw = readIfExists(cwd, DOC_REL_PATHS.wisdom);

  const sentinels: Violation[] = [];
  const missing: Array<[string | null, string]> = [
    [configRaw, DOC_REL_PATHS.config],
    [factRaw, DOC_REL_PATHS.fact],
    [knowledgeRaw, DOC_REL_PATHS.knowledge],
    [wisdomRaw, DOC_REL_PATHS.wisdom],
  ];
  for (const [raw, rel] of missing) {
    if (raw === null) {
      sentinels.push({
        family: 'sentinel',
        file: rel,
        line: 1,
        message: `${rel} not found — run /pastiche-init first.`,
      });
    }
  }

  return { configRaw, factRaw, knowledgeRaw, wisdomRaw, sentinels };
}

// ---------------------------------------------------------------------------
// main() — composes the pipeline; filled in by Task 9.
// ---------------------------------------------------------------------------

function main(): void {
  throw new Error('main: not implemented yet (Task 9)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
