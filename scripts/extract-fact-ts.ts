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

export function loadConfig(_cwd: string): Config {
  throw new Error('loadConfig: not implemented yet (Task 3)');
}

export function extractTokens(_cssPaths: string[], _cwd: string): string[] {
  throw new Error('extractTokens: not implemented yet (Task 4)');
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
