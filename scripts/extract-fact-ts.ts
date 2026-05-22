/**
 * Pastiche FACT extractor.
 *
 * Reads ./pastiche/config.yaml (CWD-relative), walks the configured packages
 * (.d.ts aggregate or source_dir), parses the configured CSS files for tokens,
 * and writes a YAML-keyed catalog to ./pastiche/FACT.md. Mechanical only — no
 * LLM, no inference. Operates entirely on CWD; plugin install location is
 * opaque to this script.
 *
 * Output format: `docs/spec/phase-2-templates-and-skills.md` §3.
 * Locked decisions: `docs/spec/task-4.1-extract-fact-ts.md`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as YAML from 'yaml';
import {
  Project,
  Node,
  type InterfaceDeclaration,
  type SourceFile,
  type TypeNode,
} from 'ts-morph';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PackageEntry {
  name: string;
  types?: string;
  source_dir?: string;
}

export interface Config {
  platform: 'claude-code' | 'codex' | null;
  packages: PackageEntry[];
  tokens: string[];
}

export interface Component {
  name: string;
  pkg: string;
  propsTypeNode?: TypeNode;
  propsInterface?: InterfaceDeclaration;
  position: number;
  ctx: ResolveCtx;
}

export interface ResolveCtx {
  localTypeAliases: Map<string, TypeNode>;
  exportNames: Set<string>;
  visiting: Set<string>;
}

// ---------------------------------------------------------------------------
// Pipeline stages — stubs filled in by subsequent tasks
// ---------------------------------------------------------------------------

export function loadConfig(cwd: string): Config {
  const configPath = path.join(cwd, 'pastiche', 'config.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `pastiche/config.yaml not found in ${cwd}. Run /pastiche-init first.`,
    );
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse pastiche/config.yaml: ${msg}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('pastiche/config.yaml must be a YAML mapping at top level.');
  }
  const obj = parsed as Record<string, unknown>;

  const platform = (obj.platform ?? null) as Config['platform'];
  const packagesRaw = (obj.packages ?? []) as unknown[];
  const tokensRaw = (obj.tokens ?? []) as unknown[];

  if (!Array.isArray(packagesRaw)) {
    throw new Error('`packages` must be a list.');
  }
  if (!Array.isArray(tokensRaw)) {
    throw new Error('`tokens` must be a list of CSS file path strings.');
  }

  const packages: PackageEntry[] = packagesRaw.map((entryUnknown, i) => {
    if (!entryUnknown || typeof entryUnknown !== 'object') {
      throw new Error(`packages[${i}] must be a mapping with \`name\` and exactly one of \`types\` or \`source_dir\`.`);
    }
    const entry = entryUnknown as Record<string, unknown>;
    const name = entry.name;
    if (typeof name !== 'string' || !name) {
      throw new Error(`packages[${i}].name must be a non-empty string.`);
    }
    const hasTypes = typeof entry.types === 'string' && entry.types.length > 0;
    const hasSourceDir = typeof entry.source_dir === 'string' && entry.source_dir.length > 0;
    if (hasTypes === hasSourceDir) {
      throw new Error(
        `packages[${i}] (${name}) must declare exactly one of \`types\` or \`source_dir\`.`,
      );
    }
    if (hasTypes) {
      const typesPath = entry.types as string;
      const abs = path.resolve(cwd, typesPath);
      if (!fs.existsSync(abs)) {
        throw new Error(`packages[${i}] (${name}): types file does not exist: ${typesPath}`);
      }
      return { name, types: typesPath };
    } else {
      const dirPath = entry.source_dir as string;
      const abs = path.resolve(cwd, dirPath);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
        throw new Error(`packages[${i}] (${name}): source_dir does not exist or is not a directory: ${dirPath}`);
      }
      return { name, source_dir: dirPath };
    }
  });

  const tokens: string[] = tokensRaw.map((tokenUnknown, i) => {
    if (typeof tokenUnknown !== 'string') {
      throw new Error(`tokens[${i}] must be a string (path to a CSS file).`);
    }
    const abs = path.resolve(cwd, tokenUnknown);
    if (!fs.existsSync(abs)) {
      throw new Error(`tokens[${i}]: CSS file does not exist: ${tokenUnknown}`);
    }
    return tokenUnknown;
  });

  return { platform, packages, tokens };
}

export function extractTokens(cssPaths: string[], cwd: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const emit = (n: string) => {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  for (const rel of cssPaths) {
    const abs = path.resolve(cwd, rel);
    const raw = fs.readFileSync(abs, 'utf8');
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

    // (1) Harvest CSS custom property declarations regardless of containing
    // selector. Regex matches "--name:" in declaration position — `var(--x)`
    // usages lack the colon and don't match.
    const propRe = /(--[a-zA-Z0-9_-]+)\s*:/g;
    let pm: RegExpExecArray | null;
    while ((pm = propRe.exec(css))) {
      emit(pm[1]);
    }

    // (2) Harvest class selectors. Char-walk: each `{` closes the current
    // selector text; `}` or `;` reset the selector start. Skip selectors
    // starting with `@` (at-rules) and skip selectors that are keyframe
    // markers (`from`, `to`, percentage) — those have no leading `.`, so the
    // `.classname` regex below filters them out naturally.
    let selStart = 0;
    for (let i = 0; i < css.length; i++) {
      const ch = css[i];
      if (ch === '{') {
        const selector = css.slice(selStart, i).trim();
        if (selector && !selector.startsWith('@')) {
          const cls = selector.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g);
          if (cls) for (const c of cls) emit(c);
        }
        selStart = i + 1;
      } else if (ch === '}' || ch === ';') {
        selStart = i + 1;
      }
    }
  }

  return out;
}

export function collectSourceFiles(_dir: string, _cwd: string): string[] {
  throw new Error('collectSourceFiles: not implemented yet (Task 5)');
}

export function buildProject(
  _cfg: Config,
  _cwd: string,
): { project: Project; packageSources: Map<string, SourceFile[]> } {
  throw new Error('buildProject: not implemented yet (Task 6)');
}

export function discoverComponentsForPackage(
  _pkg: PackageEntry,
  _sources: SourceFile[],
): Component[] {
  throw new Error('discoverComponentsForPackage: not implemented yet (Task 7)');
}

export function renderFact(_components: Component[], _tokens: string[]): string {
  throw new Error('renderFact: not implemented yet (Task 8)');
}

// ---------------------------------------------------------------------------
// main() — composes the pipeline; filled in fully by Task 11
// ---------------------------------------------------------------------------

function main(): void {
  throw new Error('main: not implemented yet (Task 11)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
