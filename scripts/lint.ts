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
import { CANONICAL_SECTIONS, SETUP_PROGRESS_KEYS } from './canonical-sections.ts';

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
// FACT parse + schema (grep-style; mirrors implementer-round1 grep contract)
// ---------------------------------------------------------------------------

export interface FactAtoms {
  components: Set<string>;
  tokens: Set<string>;
}

export interface ParseAndValidateFactResult {
  atoms: FactAtoms;
  violations: Violation[];
}

const FACT = 'pastiche/FACT.md';
const ATOM_NAME_RE = /^([A-Za-z][\w.]*):/;
const H2_RE = /^## (.+?)\s*$/;
const FENCE_OPEN_RE = /^```yaml\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;
const COMMENT_RE = /^<!--/;

export function parseAndValidateFact(text: string): ParseAndValidateFactResult {
  const violations: Violation[] = [];
  const components = new Set<string>();
  const tokens = new Set<string>();
  const lines = text.split('\n');

  // Scan H2 positions.
  let componentsH2: number = -1;
  let tokensH2: number = -1;
  const h2Positions: Array<{ name: string; line: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(H2_RE);
    if (!m) continue;
    h2Positions.push({ name: m[1].trim(), line: i });
    if (m[1].trim() === 'Components' && componentsH2 === -1) componentsH2 = i;
    if (m[1].trim() === 'Tokens' && tokensH2 === -1) tokensH2 = i;
  }

  if (componentsH2 === -1) {
    violations.push(violation('fact', FACT, 1, 'missing "## Components" H2 header.'));
  }
  if (tokensH2 === -1) {
    violations.push(violation('fact', FACT, 1, 'missing "## Tokens" H2 header.'));
  }

  // Parse components fence (only if H2 exists).
  if (componentsH2 !== -1) {
    // Find next H2 after Components, to bound the search for the fence.
    const nextH2AfterComponents = h2Positions.find((h) => h.line > componentsH2);
    const searchEnd = nextH2AfterComponents ? nextH2AfterComponents.line : lines.length;

    let fenceOpen = -1;
    let fenceClose = -1;
    for (let i = componentsH2 + 1; i < searchEnd; i++) {
      if (fenceOpen === -1 && FENCE_OPEN_RE.test(lines[i])) {
        fenceOpen = i;
        continue;
      }
      if (fenceOpen !== -1 && FENCE_CLOSE_RE.test(lines[i])) {
        fenceClose = i;
        break;
      }
    }

    if (fenceOpen === -1) {
      violations.push(
        violation(
          'fact',
          FACT,
          componentsH2 + 1,
          'missing fenced ```yaml block under "## Components".',
        ),
      );
    } else if (fenceClose === -1) {
      violations.push(
        violation(
          'fact',
          FACT,
          fenceOpen + 1,
          'unclosed ```yaml fence under "## Components".',
        ),
      );
    } else {
      // Scan column-0 lines inside the fence for atom names + structural validity.
      for (let i = fenceOpen + 1; i < fenceClose; i++) {
        const raw = lines[i];
        if (raw.length === 0) continue;
        if (COMMENT_RE.test(raw)) continue;
        // Indented lines are prop bodies — not validated.
        if (/^\s/.test(raw)) continue;
        const m = raw.match(ATOM_NAME_RE);
        if (!m) {
          violations.push(
            violation(
              'fact',
              FACT,
              i + 1,
              `invalid column-0 line inside Components block (expected atom-name shape "Name:"): ${JSON.stringify(raw)}.`,
            ),
          );
          continue;
        }
        const name = m[1];
        if (components.has(name)) {
          violations.push(
            violation('fact', FACT, i + 1, `duplicate atom name "${name}".`),
          );
          continue;
        }
        components.add(name);
      }
    }
  }

  // Parse tokens section (only if H2 exists).
  if (tokensH2 !== -1) {
    const nextH2AfterTokens = h2Positions.find((h) => h.line > tokensH2);
    const searchEnd = nextH2AfterTokens ? nextH2AfterTokens.line : lines.length;
    for (let i = tokensH2 + 1; i < searchEnd; i++) {
      const raw = lines[i];
      if (raw.length === 0) continue;
      if (COMMENT_RE.test(raw.trimStart())) continue;
      if (/^\s/.test(raw)) {
        violations.push(
          violation('fact', FACT, i + 1, `token line has leading whitespace: ${JSON.stringify(raw)}.`),
        );
        continue;
      }
      if (raw.startsWith('- ')) {
        violations.push(
          violation('fact', FACT, i + 1, `token line has bullet prefix "- " (not allowed): ${JSON.stringify(raw)}.`),
        );
        continue;
      }
      const token = raw;
      if (tokens.has(token)) {
        violations.push(
          violation('fact', FACT, i + 1, `duplicate token "${token}".`),
        );
        continue;
      }
      tokens.add(token);
    }
  }

  return { atoms: { components, tokens }, violations };
}

// ---------------------------------------------------------------------------
// WISDOM tag lint (strict format per spec decision 6)
// ---------------------------------------------------------------------------

const WISDOM = 'pastiche/WISDOM.md';
const TAG_CHAR_RE = /^[A-Za-z0-9_.\-]+$/;
const ALLOW_LISTED_TAGS = new Set(['GENERAL']);
const LEADING_BULLET_RE = /^- \[([^\]]*)\]/;
const CODE_SPAN_RE = /`[^`]*`/g;

export interface LintWisdomCounts {
  tagsChecked: number;
  generalTags: number;
  factBoundTags: number;
}

export interface LintWisdomResult {
  violations: Violation[];
  counts: LintWisdomCounts;
}

export function lintWisdom(text: string, atomsArg: FactAtoms): LintWisdomResult {
  const violations: Violation[] = [];
  const validAtoms = new Set([...atomsArg.components, ...atomsArg.tokens]);
  let tagsChecked = 0;
  let generalTags = 0;
  let factBoundTags = 0;

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trimStart().startsWith('<!--')) continue;

    // Strip backtick code-spans so bracketed Tailwind/arbitrary values inside
    // backticks don't get parsed as tag groups.
    const stripped = raw.replace(CODE_SPAN_RE, '');

    // Only the leading "- [...]" bracket group is a tag group.
    const m = stripped.match(LEADING_BULLET_RE);
    if (!m) continue;
    const inner = m[1];

    // Legacy concatenated [A][B] form check — after the closing ] of the
    // first bracket group, is the next character '['?
    const closingIdx = stripped.indexOf(']');
    if (closingIdx >= 0 && stripped[closingIdx + 1] === '[') {
      violations.push(
        violation(
          'wisdom',
          WISDOM,
          i + 1,
          'legacy concatenated bracket form "[A][B]" is not allowed — use "[A,B]".',
        ),
      );
      continue;
    }

    // Malformed bracket group checks.
    const isMalformed =
      inner.length === 0 ||
      /\s/.test(inner) ||
      inner.startsWith(',') ||
      inner.endsWith(',') ||
      inner.includes(',,');
    if (isMalformed) {
      violations.push(
        violation(
          'wisdom',
          WISDOM,
          i + 1,
          `malformed tag group "[${inner}]" — use strict [Tag1,Tag2,...] with no whitespace.`,
        ),
      );
      continue;
    }

    // Split and validate each tag.
    const tags = inner.split(',');
    let lineHadInvalidShape = false;
    for (const tag of tags) {
      if (!TAG_CHAR_RE.test(tag)) {
        violations.push(
          violation(
            'wisdom',
            WISDOM,
            i + 1,
            `malformed tag group "[${inner}]" — tag "${tag}" has invalid characters.`,
          ),
        );
        lineHadInvalidShape = true;
        break;
      }
    }
    if (lineHadInvalidShape) continue;

    for (const tag of tags) {
      tagsChecked++;
      if (ALLOW_LISTED_TAGS.has(tag)) {
        generalTags++;
        continue;
      }
      if (!validAtoms.has(tag)) {
        violations.push(
          violation('wisdom', WISDOM, i + 1, `unknown tag [${tag}] — not in FACT.md.`),
        );
        continue;
      }
      factBoundTags++;
    }
  }

  return { violations, counts: { tagsChecked, generalTags, factBoundTags } };
}

// ---------------------------------------------------------------------------
// KNOWLEDGE refs lint (FACT-membership-only per spec decision 1)
// ---------------------------------------------------------------------------

const KNOWLEDGE = 'pastiche/KNOWLEDGE.md';
const KNOWLEDGE_CODE_SPAN_RE = /`([^`]+)`/g;
const PASCAL_HEAD_RE = /^([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)\b/;

export interface LintKnowledgeRefsCounts {
  codeSpansChecked: number;
  componentRefs: number;
  tokenRefs: number;
  ignored: number;
}

export interface LintKnowledgeRefsResult {
  violations: Violation[];
  counts: LintKnowledgeRefsCounts;
}

export function lintKnowledgeRefs(
  text: string,
  atomsArg: FactAtoms,
): LintKnowledgeRefsResult {
  const violations: Violation[] = [];
  let codeSpansChecked = 0;
  let componentRefs = 0;
  let tokenRefs = 0;
  let ignored = 0;

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('<!--')) continue;
    let m: RegExpExecArray | null;
    KNOWLEDGE_CODE_SPAN_RE.lastIndex = 0;
    while ((m = KNOWLEDGE_CODE_SPAN_RE.exec(line)) !== null) {
      const span = m[1].trim();
      codeSpansChecked++;
      const head = span.match(PASCAL_HEAD_RE);
      if (head) {
        const name = head[1];
        if (atomsArg.components.has(name)) {
          componentRefs++;
        } else {
          violations.push(
            violation(
              'knowledge',
              KNOWLEDGE,
              i + 1,
              `unknown component \`${name}\` (in \`${span}\`) — not in FACT.md.`,
            ),
          );
        }
        continue;
      }
      if (atomsArg.tokens.has(span)) {
        tokenRefs++;
        continue;
      }
      ignored++;
    }
  }

  return {
    violations,
    counts: { codeSpansChecked, componentRefs, tokenRefs, ignored },
  };
}

// ---------------------------------------------------------------------------
// KNOWLEDGE canonical sections check
// ---------------------------------------------------------------------------

export interface LintKnowledgeSectionsResult {
  violations: Violation[];
  found: number;
}

export function lintKnowledgeSections(text: string): LintKnowledgeSectionsResult {
  const violations: Violation[] = [];
  const present = new Set<string>();
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(H2_RE);
    if (m) present.add(m[1].trim());
  }
  let found = 0;
  for (const section of CANONICAL_SECTIONS) {
    if (present.has(section.name)) {
      found++;
    } else {
      violations.push(
        violation(
          'knowledge',
          KNOWLEDGE,
          1,
          `missing canonical section: "## ${section.name}" (may be an empty stub).`,
        ),
      );
    }
  }
  return { violations, found };
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
