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
import * as YAML from 'yaml';
import { SETUP_PROGRESS_KEYS } from './canonical-sections.ts';

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
// Config validation
// ---------------------------------------------------------------------------

const PLATFORM_VALUES = ['claude-code', 'codex'] as const;
const SETUP_PROGRESS_VALUES = ['stub', 'done'] as const;

export interface ConfigShape {
  platform: string | null;
  packages: unknown;
  tokens: unknown;
  design_md_reference: unknown;
  typecheck_command: unknown;
  setup_progress: unknown;
}

export interface ValidateConfigResult {
  config: ConfigShape | null;
  violations: Violation[];
}

function violation(
  family: ViolationFamily,
  file: string,
  line: number,
  message: string,
): Violation {
  return { family, file, line, message };
}

const CFG = 'pastiche/config.yaml';

export function validateConfig(raw: string): ValidateConfigResult {
  const violations: Violation[] = [];

  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    violations.push(violation('config', CFG, 1, `YAML parse error: ${msg}`));
    return { config: null, violations };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    violations.push(violation('config', CFG, 1, 'config root must be a YAML map'));
    return { config: null, violations };
  }

  const obj = parsed as Record<string, unknown>;
  const config: ConfigShape = {
    platform: (obj.platform ?? null) as string | null,
    packages: obj.packages,
    tokens: obj.tokens,
    design_md_reference: obj.design_md_reference ?? null,
    typecheck_command: obj.typecheck_command ?? null,
    setup_progress: obj.setup_progress,
  };

  // --- Sentinels ---

  if (config.platform === null || config.platform === undefined) {
    violations.push(violation('sentinel', CFG, 1, 'platform not set — run /pastiche-init.'));
  }
  if (config.typecheck_command === null || config.typecheck_command === undefined) {
    violations.push(
      violation('sentinel', CFG, 1, 'typecheck_command not set — run /pastiche-init.'),
    );
  }
  const packagesIsEmpty =
    Array.isArray(config.packages) && config.packages.length === 0;
  const tokensIsEmpty = Array.isArray(config.tokens) && config.tokens.length === 0;
  if (packagesIsEmpty && tokensIsEmpty) {
    violations.push(
      violation(
        'sentinel',
        CFG,
        1,
        'declare at least one packages entry or one tokens file — pastiche has nothing to extract.',
      ),
    );
  }

  // --- Schema (validate only when non-null/non-undefined) ---

  if (config.platform !== null && config.platform !== undefined) {
    if (!PLATFORM_VALUES.includes(config.platform as (typeof PLATFORM_VALUES)[number])) {
      violations.push(
        violation(
          'config',
          CFG,
          1,
          `platform must be one of: ${PLATFORM_VALUES.join(', ')} (got ${JSON.stringify(config.platform)}).`,
        ),
      );
    }
  }

  if (config.packages !== undefined) {
    if (!Array.isArray(config.packages)) {
      violations.push(violation('config', CFG, 1, 'packages must be a list.'));
    } else {
      const seenNames = new Set<string>();
      for (let i = 0; i < config.packages.length; i++) {
        const entry = config.packages[i];
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
          violations.push(violation('config', CFG, 1, `packages[${i}] must be a map.`));
          continue;
        }
        const e = entry as Record<string, unknown>;
        const nameVal = e.name;
        if (typeof nameVal !== 'string' || nameVal.length === 0) {
          violations.push(
            violation('config', CFG, 1, `packages[${i}].name must be a non-empty string.`),
          );
        } else if (seenNames.has(nameVal)) {
          violations.push(
            violation('config', CFG, 1, `duplicate package name "${nameVal}" in packages[${i}].`),
          );
        } else {
          seenNames.add(nameVal);
        }
        const hasTypes = e.types !== undefined && e.types !== null;
        const hasSourceDir = e.source_dir !== undefined && e.source_dir !== null;
        if (hasTypes === hasSourceDir) {
          violations.push(
            violation(
              'config',
              CFG,
              1,
              `packages[${i}] must declare exactly one of types or source_dir.`,
            ),
          );
        }
        if (hasTypes && (typeof e.types !== 'string' || (e.types as string).length === 0)) {
          violations.push(
            violation('config', CFG, 1, `packages[${i}].types must be a non-empty string.`),
          );
        }
        if (hasSourceDir && (typeof e.source_dir !== 'string' || (e.source_dir as string).length === 0)) {
          violations.push(
            violation('config', CFG, 1, `packages[${i}].source_dir must be a non-empty string.`),
          );
        }
      }
    }
  }

  if (config.tokens !== undefined) {
    if (!Array.isArray(config.tokens)) {
      violations.push(violation('config', CFG, 1, 'tokens must be a list.'));
    } else {
      for (let i = 0; i < config.tokens.length; i++) {
        const t = config.tokens[i];
        if (typeof t !== 'string' || t.length === 0) {
          violations.push(
            violation('config', CFG, 1, `tokens[${i}] must be a non-empty string.`),
          );
        }
      }
    }
  }

  if (
    config.design_md_reference !== null &&
    config.design_md_reference !== undefined &&
    typeof config.design_md_reference !== 'string'
  ) {
    violations.push(
      violation('config', CFG, 1, 'design_md_reference must be a string or null.'),
    );
  }

  if (config.typecheck_command !== null && config.typecheck_command !== undefined) {
    if (typeof config.typecheck_command !== 'string' || (config.typecheck_command as string).length === 0) {
      violations.push(
        violation('config', CFG, 1, 'typecheck_command must be a non-empty string.'),
      );
    }
  }

  if (config.setup_progress !== undefined) {
    if (
      config.setup_progress === null ||
      typeof config.setup_progress !== 'object' ||
      Array.isArray(config.setup_progress)
    ) {
      violations.push(violation('config', CFG, 1, 'setup_progress must be a map.'));
    } else {
      const sp = config.setup_progress as Record<string, unknown>;
      const expected = new Set(SETUP_PROGRESS_KEYS);
      for (const required of SETUP_PROGRESS_KEYS) {
        if (!(required in sp)) {
          violations.push(
            violation('config', CFG, 1, `setup_progress missing key "${required}".`),
          );
        }
      }
      for (const key of Object.keys(sp)) {
        if (!expected.has(key)) {
          violations.push(
            violation('config', CFG, 1, `setup_progress has unexpected key "${key}".`),
          );
          continue;
        }
        const val = sp[key];
        if (
          typeof val !== 'string' ||
          !SETUP_PROGRESS_VALUES.includes(val as (typeof SETUP_PROGRESS_VALUES)[number])
        ) {
          violations.push(
            violation(
              'config',
              CFG,
              1,
              `setup_progress.${key} must be one of: ${SETUP_PROGRESS_VALUES.join(', ')} (got ${JSON.stringify(val)}).`,
            ),
          );
        }
      }
    }
  }

  return { config, violations };
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
