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
  SyntaxKind,
  type InterfaceDeclaration,
  type SourceFile,
  type TypeNode,
} from 'ts-morph';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PackageEntry {
  name: string;
  types?: string[];
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
  knownPaths: Set<string>;
}

const SOURCE_EXTS = new Set(['.ts', '.tsx']);
const SIDECAR_RE = /\.(test|stories|spec)\.(ts|tsx)$/;

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
    const rawTypes = entry.types;
    let typesPaths: string[] | null = null;
    if (typeof rawTypes === 'string' && rawTypes.length > 0) {
      typesPaths = [rawTypes];
    } else if (Array.isArray(rawTypes) && rawTypes.length > 0 && rawTypes.every(t => typeof t === 'string')) {
      typesPaths = rawTypes as string[];
    }
    const hasTypes = typesPaths !== null;
    const hasSourceDir = typeof entry.source_dir === 'string' && entry.source_dir.length > 0;
    if (hasTypes === hasSourceDir) {
      throw new Error(
        `packages[${i}] (${name}) must declare exactly one of \`types\` or \`source_dir\`.`,
      );
    }
    if (hasTypes) {
      for (const tp of typesPaths!) {
        const abs = path.resolve(cwd, tp);
        if (!fs.existsSync(abs)) {
          throw new Error(`packages[${i}] (${name}): types file does not exist: ${tp}`);
        }
      }
      return { name, types: typesPaths! };
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

export function collectSourceFiles(dir: string, cwd: string): string[] {
  const root = path.resolve(cwd, dir);
  const entries = fs.readdirSync(root, { recursive: true, withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const full = path.join(e.parentPath ?? root, e.name);
    if (e.name.endsWith('.d.ts')) continue;
    const ext = path.extname(e.name);
    if (!SOURCE_EXTS.has(ext)) continue;
    if (SIDECAR_RE.test(e.name)) continue;
    out.push(full);
  }
  out.sort();
  return out;
}

export function resolveReExports(project: Project, entryFile: SourceFile): SourceFile[] {
  const resolved: SourceFile[] = [];
  const seen = new Set<string>([entryFile.getFilePath()]);
  const queue: SourceFile[] = [entryFile];

  while (queue.length > 0) {
    const sf = queue.shift()!;
    for (const exportDecl of sf.getExportDeclarations()) {
      const specifier = exportDecl.getModuleSpecifierValue();
      if (!specifier || !specifier.startsWith('.')) continue;
      const target = exportDecl.getModuleSpecifierSourceFile();
      if (!target) continue;
      const targetPath = target.getFilePath();
      if (seen.has(targetPath)) continue;
      seen.add(targetPath);
      let added = project.getSourceFile(targetPath);
      if (!added) {
        added = project.addSourceFileAtPath(targetPath);
      }
      resolved.push(added);
      queue.push(added);
    }
  }
  return resolved;
}

export function buildProject(
  cfg: Config,
  cwd: string,
): { project: Project; packageSources: Map<string, SourceFile[]> } {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: false,
      noResolve: false,
      target: 99, // ESNext
      module: 99, // ESNext
      moduleResolution: 100, // Bundler
    },
  });
  const packageSources = new Map<string, SourceFile[]>();
  for (const pkg of cfg.packages) {
    const sources: SourceFile[] = [];
    if (pkg.types) {
      for (const tp of pkg.types) {
        const abs = path.resolve(cwd, tp);
        const entry = project.addSourceFileAtPath(abs);
        sources.push(entry);
        sources.push(...resolveReExports(project, entry));
      }
    } else if (pkg.source_dir) {
      const files = collectSourceFiles(pkg.source_dir, cwd);
      for (const f of files) {
        sources.push(project.addSourceFileAtPath(f));
      }
    }
    packageSources.set(pkg.name, sources);
  }
  return { project, packageSources };
}

// ---------------------------------------------------------------------------
// Type classification + rendering
// ---------------------------------------------------------------------------

type Classification =
  | { kind: 'spread' }
  | { kind: 'expand' }
  | { kind: 'recurse'; node: TypeNode; aliasName?: string }
  | { kind: 'recurse-iface'; decl: InterfaceDeclaration; aliasName: string }
  | { kind: 'recurse-known-args'; args: Array<{ node: TypeNode } | { iface: InterfaceDeclaration }> }
  | {
      kind: 'recurse-omit';
      target: { node: TypeNode } | { iface: InterfaceDeclaration };
      omit: Set<string>;
      aliasName: string;
    };

/**
 * If `node` is a literal-union of strings (or a single string literal),
 * return the set of literal values. Anything else returns null — caller
 * falls back to spread rendering.
 */
function extractStringLiteralKeys(node: TypeNode): Set<string> | null {
  if (Node.isLiteralTypeNode(node)) {
    const lit = node.getLiteral();
    if (Node.isStringLiteral(lit)) return new Set([lit.getLiteralValue()]);
    return null;
  }
  if (Node.isUnionTypeNode(node)) {
    const out = new Set<string>();
    for (const m of node.getTypeNodes()) {
      if (Node.isLiteralTypeNode(m)) {
        const lit = m.getLiteral();
        if (Node.isStringLiteral(lit)) {
          out.add(lit.getLiteralValue());
          continue;
        }
        // Accept `null` as a literal-type member (commonly added by cva narrowing).
        if (lit.getKindName() === 'NullKeyword') continue;
        return null;
      }
      // `undefined` is a KeywordTypeNode in unions (not a LiteralTypeNode).
      if (m.getKindName() === 'UndefinedKeyword') continue;
      return null;
    }
    return out.size > 0 ? out : null;
  }
  return null;
}

/**
 * Resolve a TypeReference to a project-local declaration we can recurse
 * into (a TypeAlias's RHS or an Interface). Same-file local aliases win;
 * otherwise fall back to the type checker (cross-file, e.g. form package
 * referencing CheckboxProps from the web package's d.ts). Returns null
 * for `node_modules`-defined types or anything unresolved — the caller
 * keeps the spread fallback.
 */
function resolveLocalProjectType(
  ref: TypeNode,
  ctx: ResolveCtx,
): ({ target: { node: TypeNode }; aliasName: string }
  | { target: { iface: InterfaceDeclaration }; aliasName: string }
  | null) {
  if (!Node.isTypeReference(ref)) return null;
  const aliasName = ref.getTypeName().getText();
  if (ctx.visiting.has(aliasName)) return null;
  const localAlias = ctx.localTypeAliases.get(aliasName);
  if (localAlias) return { target: { node: localAlias }, aliasName };
  const t = ref.getType();
  const sym = t.getAliasSymbol() ?? t.getSymbol();
  const decls = sym?.getDeclarations() ?? [];
  for (const d of decls) {
    const filePath = d.getSourceFile().getFilePath();
    if (filePath.includes('/node_modules/') && !ctx.knownPaths.has(filePath)) continue;
    if (Node.isTypeAliasDeclaration(d)) {
      const tn = d.getTypeNode();
      if (tn && tn.getKind() !== SyntaxKind.ConditionalType) {
        return { target: { node: tn }, aliasName };
      }
    }
    if (Node.isInterfaceDeclaration(d)) {
      return { target: { iface: d }, aliasName };
    }
  }
  return null;
}

function hasKnownPathArg(node: TypeNode, ctx: ResolveCtx): boolean {
  if (!Node.isTypeReference(node)) return false;
  for (const arg of node.getTypeArguments()) {
    if (arg.getKind() === SyntaxKind.TypeQuery) {
      if (ctx.knownPaths.has(arg.getSourceFile().getFilePath())) return true;
      continue;
    }
    const t = arg.getType();
    const sym = t.getAliasSymbol() ?? t.getSymbol();
    for (const d of sym?.getDeclarations() ?? []) {
      if (ctx.knownPaths.has(d.getSourceFile().getFilePath())) return true;
    }
  }
  return false;
}

type ExpandableArg = { node: TypeNode } | { iface: InterfaceDeclaration };

function resolveKnownArgs(node: TypeNode, ctx: ResolveCtx): ExpandableArg[] | null {
  if (!Node.isTypeReference(node)) return null;
  const args = node.getTypeArguments();
  if (args.length === 0) return null;

  // (1) `typeof X` arg — follow X's value declaration's type annotation.
  for (const arg of args) {
    if (arg.getKind() !== SyntaxKind.TypeQuery) continue;
    const exprName = arg.getText().replace(/^typeof\s+/, '').trim();
    const sf = arg.getSourceFile();
    for (const stmt of sf.getStatements()) {
      if (!Node.isVariableStatement(stmt)) continue;
      for (const decl of stmt.getDeclarations()) {
        if (decl.getName() !== exprName) continue;
        const typeAnnotation = decl.getTypeNode();
        if (!typeAnnotation) continue;
        if (Node.isTypeReference(typeAnnotation)) {
          const expandable = collectExpandableArgs(typeAnnotation.getTypeArguments(), ctx);
          if (expandable.length > 0) return expandable;
        }
        const styledName = `Styled${exprName}Props`;
        const styledAlias = ctx.localTypeAliases.get(styledName);
        if (styledAlias && (Node.isTypeLiteral(styledAlias) || Node.isIntersectionTypeNode(styledAlias))) {
          return [{ node: styledAlias }];
        }
        // Cross-file: scan the typeof arg's own source file for the styled alias.
        for (const s of sf.getStatements()) {
          if (!Node.isTypeAliasDeclaration(s) || s.getName() !== styledName) continue;
          const tn2 = s.getTypeNode();
          if (tn2 && (Node.isTypeLiteral(tn2) || Node.isIntersectionTypeNode(tn2))) {
            return [{ node: tn2 }];
          }
        }
      }
    }
  }

  // (2) Direct type reference args (e.g., React.FC<ButtonProps>).
  const expandable = collectExpandableArgs(args, ctx);
  if (expandable.length > 0) return expandable;

  return null;
}

function collectExpandableArgs(args: TypeNode[], ctx: ResolveCtx): ExpandableArg[] {
  const out: ExpandableArg[] = [];
  for (const a of args) {
    if (Node.isTypeLiteral(a)) {
      out.push({ node: a });
      continue;
    }
    if (Node.isIntersectionTypeNode(a)) {
      out.push({ node: a });
      continue;
    }
    if (!Node.isTypeReference(a)) continue;
    const name = a.getTypeName().getText();
    const local = ctx.localTypeAliases.get(name);
    if (local && (Node.isTypeLiteral(local) || Node.isIntersectionTypeNode(local))) {
      out.push({ node: local });
      continue;
    }
    const resolved = resolveLocalProjectType(a, ctx);
    if (resolved) {
      if ('iface' in resolved.target) {
        out.push({ iface: resolved.target.iface });
      } else if (Node.isTypeLiteral(resolved.target.node) || Node.isIntersectionTypeNode(resolved.target.node)) {
        out.push({ node: resolved.target.node });
      }
    }
  }
  return out;
}

function classifyBranch(node: TypeNode, ctx: ResolveCtx): Classification {
  if (Node.isTypeLiteral(node)) return { kind: 'expand' };
  if (Node.isTypeReference(node)) {
    const nameText = node.getTypeName().getText();
    if (nameText === 'Omit') {
      // Flatten `Omit<X, K>` when X is a project-local type — recurse into
      // X's segments and drop the omitted props (and merge keys into any
      // inner spread's own Omit). Keeps wrappers like FormCheckboxProps
      // readable end-to-end without forcing the reader to chase atom names.
      const args = node.getTypeArguments();
      if (args.length === 2) {
        const keys = extractStringLiteralKeys(args[1]);
        if (keys) {
          const resolved = resolveLocalProjectType(args[0], ctx);
          if (resolved) {
            return { kind: 'recurse-omit', target: resolved.target, omit: keys, aliasName: resolved.aliasName };
          }
        }
      }
      return { kind: 'spread' };
    }
    if (nameText === 'Pick') {
      // Pick recursion has different semantics (keep-list, plus inversion
      // for inner spreads); not worth the complexity yet — keep as spread.
      return { kind: 'spread' };
    }
    if (nameText === 'VariantProps' || nameText.endsWith('.VariantProps')) {
      return { kind: 'expand' };
    }
    // Local non-exported type alias → recurse into its definition so the
    // reader sees the underlying shape rather than an opaque name.
    const localAlias = ctx.localTypeAliases.get(nameText);
    if (localAlias && !ctx.exportNames.has(nameText) && !ctx.visiting.has(nameText)) {
      return { kind: 'recurse', node: localAlias, aliasName: nameText };
    }
    const t = node.getType();
    const sym = t.getAliasSymbol() ?? t.getSymbol();
    const decls = sym?.getDeclarations() ?? [];
    if (decls.length === 0) {
      const knownArgs = resolveKnownArgs(node, ctx);
      if (knownArgs) return { kind: 'recurse-known-args', args: knownArgs };
      return { kind: 'spread' };
    }
    const fp = decls[0].getSourceFile().getFilePath();
    if (fp.includes('/node_modules/') && !ctx.knownPaths.has(fp)) {
      const knownArgs = resolveKnownArgs(node, ctx);
      if (knownArgs) return { kind: 'recurse-known-args', args: knownArgs };
      return { kind: 'spread' };
    }
    const resolved = resolveLocalProjectType(node, ctx);
    if (resolved) {
      if ('iface' in resolved.target) {
        return { kind: 'recurse-iface', decl: resolved.target.iface, aliasName: resolved.aliasName };
      }
      return { kind: 'recurse', node: resolved.target.node, aliasName: resolved.aliasName };
    }
    return { kind: 'spread' };
  }
  return { kind: 'expand' };
}

interface RenderedProp {
  name: string;
  optional: boolean;
  type: ResolvedType;
}
type RenderedSegment =
  | { kind: 'spread'; text: string }
  | { kind: 'expand'; props: RenderedProp[] };

const NULL_UNDEFINED_RE = /\s*\|\s*null\s*\|\s*undefined\s*$|\s*\|\s*undefined\s*$|\s*\|\s*null\s*$/;

function cleanTypeText(s: string): string {
  let out = s.trim();
  out = out.replace(/\/\*\*[\s\S]*?\*\//g, '');
  out = out.replace(/\s+/g, ' ').trim();
  while (NULL_UNDEFINED_RE.test(out)) out = out.replace(NULL_UNDEFINED_RE, '').trim();
  return out;
}

function unquoteName(n: string): string {
  return n.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

/**
 * If `tn` is a TypeReference whose resolved type is a union of literals
 * (string/number/boolean), return the union text so it can be inlined in
 * place of the opaque alias name. Handles `keyof typeof X`, `Extract<...>`,
 * mapped types, string enums, etc. — anything the type checker collapses to
 * a finite literal union. Falls back to a syntactic check on the alias RHS
 * for the local-only `type Foo = "a" | "b"` case (cheap and avoids type-
 * checker work on the hot path).
 *
 * Capped at MAX_UNION_INLINE constituents so pathological unions (e.g.
 * `keyof CSSStyleDeclaration`) don't bloat FACT.md — above the cap the
 * caller falls back to the alias name.
 */
type InlinedType =
  | { kind: 'union'; values: string[] }
  | { kind: 'text'; text: string };

const MAX_UNION_INLINE = 100;
function maybeInlineLiteralUnion(tn: TypeNode, ctx: ResolveCtx): InlinedType | null {
  if (!Node.isTypeReference(tn)) return null;
  const refName = tn.getTypeName().getText();
  const alias = ctx.localTypeAliases.get(refName);
  if (alias) {
    if (Node.isLiteralTypeNode(alias)) {
      const lit = alias.getLiteral();
      if (Node.isStringLiteral(lit)) return { kind: 'union', values: [lit.getLiteralValue()] };
    }
    if (Node.isUnionTypeNode(alias) && alias.getTypeNodes().every(n => Node.isLiteralTypeNode(n))) {
      const vals: string[] = [];
      for (const n of alias.getTypeNodes()) {
        const lit = (n as any).getLiteral();
        if (!Node.isStringLiteral(lit)) return { kind: 'text', text: cleanTypeText(alias.getText()) };
        vals.push(lit.getLiteralValue());
      }
      return { kind: 'union', values: vals };
    }
  }
  const t = tn.getType();
  if (t.isUnion()) {
    const parts = t.getUnionTypes();
    if (parts.length > 0 && parts.length <= MAX_UNION_INLINE && parts.every(p => p.isLiteral())) {
      const vals = parts.map(p => p.getText().replace(/^['"]|['"]$/g, ''));
      return { kind: 'union', values: vals };
    }
  }
  if (alias) {
    return { kind: 'text', text: cleanTypeText(alias.getText()).replace(/\s+/g, ' ') };
  }
  return null;
}

type ResolvedType =
  | { kind: 'union'; values: string[] }
  | { kind: 'text'; text: string };

function resolveType(tn: TypeNode | undefined, fallback: string, ctx: ResolveCtx): ResolvedType {
  if (tn) {
    const inlined = maybeInlineLiteralUnion(tn, ctx);
    if (inlined) return inlined;
    const directKeys = extractStringLiteralKeys(tn);
    if (directKeys && directKeys.size > 0) {
      return { kind: 'union', values: [...directKeys] };
    }
    // Type-checker fallback: resolve `keyof typeof X`, mapped types, etc.
    // to a literal union when the checker can collapse them.
    const t = tn.getType();
    if (t.isBoolean() || t.isBooleanLiteral()) return { kind: 'text', text: 'bool' };
    if (t.isUnion()) {
      const parts = t.getUnionTypes();
      if (parts.length > 0 && parts.every(p => p.isBooleanLiteral())) {
        return { kind: 'text', text: 'bool' };
      }
      if (parts.length > 0 && parts.length <= MAX_UNION_INLINE && parts.every(p => p.isLiteral())) {
        const vals = parts.map(p => p.getText().replace(/^['"]|['"]$/g, ''));
        return { kind: 'union', values: vals };
      }
    }
    return { kind: 'text', text: cleanTypeText(tn.getText()) };
  }
  return { kind: 'text', text: cleanTypeText(fallback) };
}

function expandTypeNode(node: TypeNode, ctx: ResolveCtx): RenderedProp[] {
  const out: RenderedProp[] = [];
  if (Node.isTypeLiteral(node)) {
    for (const m of node.getMembers()) {
      if (!Node.isPropertySignature(m)) continue;
      const name = unquoteName(m.getName());
      const optional = m.hasQuestionToken();
      const tn = m.getTypeNode();
      const type = resolveType(tn, m.getType().getText(node), ctx);
      out.push({ name, optional, type });
    }
    return out;
  }
  // Resolve via type checker (e.g., VariantProps<...>)
  const t = node.getType();
  for (const sym of t.getProperties()) {
    const decls = sym.getDeclarations();
    const decl = decls[0];
    let optional = (sym.getFlags() & 16777216) !== 0; // SymbolFlags.Optional
    let type: ResolvedType;
    if (decl && Node.isPropertySignature(decl)) {
      optional = optional || decl.hasQuestionToken();
      const tn = decl.getTypeNode();
      type = resolveType(tn, sym.getTypeAtLocation(node).getText(node), ctx);
    } else {
      type = { kind: 'text', text: cleanTypeText(sym.getTypeAtLocation(node).getText(node)) };
    }
    out.push({
      name: unquoteName(sym.getName()),
      optional,
      type,
    });
  }
  return out;
}

function expandInterface(decl: InterfaceDeclaration, ctx: ResolveCtx): RenderedSegment[] {
  const segments: RenderedSegment[] = [];
  for (const heritage of decl.getExtends()) {
    const t = heritage.getType();
    const sym = t.getSymbol();
    const symDecls = sym?.getDeclarations() ?? [];
    let resolved = false;
    for (const d of symDecls) {
      if (!ctx.knownPaths.has(d.getSourceFile().getFilePath())) continue;
      if (Node.isInterfaceDeclaration(d)) {
        const aliasName = d.getName();
        if (!ctx.visiting.has(aliasName)) {
          ctx.visiting.add(aliasName);
          try {
            segments.push(...expandInterface(d, ctx));
          } finally {
            ctx.visiting.delete(aliasName);
          }
          resolved = true;
          break;
        }
      }
    }
    if (!resolved) {
      segments.push({ kind: 'spread', text: heritage.getText() });
    }
  }
  const props: RenderedProp[] = [];
  for (const m of decl.getMembers()) {
    if (!Node.isPropertySignature(m)) continue;
    const name = unquoteName(m.getName());
    const optional = m.hasQuestionToken();
    const tn = m.getTypeNode();
    const type = resolveType(tn, m.getType().getText(decl), ctx);
    props.push({ name, optional, type });
  }
  segments.push({ kind: 'expand', props });
  return segments;
}

function applyOmit(segments: RenderedSegment[], omit: Set<string>): RenderedSegment[] {
  if (omit.size === 0) return segments;
  const out: RenderedSegment[] = [];
  for (const seg of segments) {
    if (seg.kind === 'expand') {
      out.push({ kind: 'expand', props: seg.props.filter(p => !omit.has(p.name)) });
      continue;
    }
    out.push({ kind: 'spread', text: mergeOmitIntoSpread(seg.text, omit) });
  }
  return out;
}

function mergeOmitIntoSpread(text: string, omit: Set<string>): string {
  const t = text.trim();
  if (t === '(or)') return text;
  const keysUnion = [...omit].map(k => `"${k}"`).join(' | ');
  // Already `Omit<X, K1>` — extend its key list rather than nest.
  const m = t.match(/^Omit<(.+),\s*(.+)>$/s);
  if (m) return `Omit<${m[1].trim()}, ${m[2].trim()} | ${keysUnion}>`;
  return `Omit<${t}, ${keysUnion}>`;
}

function renderBranch(branch: TypeNode, ctx: ResolveCtx, flattenUnions = false): RenderedSegment[] {
  if (branch.getKind() === SyntaxKind.ParenthesizedType) {
    return renderPropsSegments((branch as any).getTypeNode(), ctx, flattenUnions);
  }
  if (Node.isIntersectionTypeNode(branch)) {
    return renderPropsSegments(branch, ctx, flattenUnions);
  }
  const cls = classifyBranch(branch, ctx);
  if (cls.kind === 'spread') return [{ kind: 'spread', text: cleanTypeText(branch.getText()) }];
  if (cls.kind === 'expand') return [{ kind: 'expand', props: expandTypeNode(branch, ctx) }];
  if (cls.kind === 'recurse') {
    if (cls.aliasName) ctx.visiting.add(cls.aliasName);
    try {
      return renderPropsSegments(cls.node, ctx, flattenUnions);
    } finally {
      if (cls.aliasName) ctx.visiting.delete(cls.aliasName);
    }
  }
  if (cls.kind === 'recurse-iface') {
    ctx.visiting.add(cls.aliasName);
    try {
      return expandInterface(cls.decl, ctx);
    } finally {
      ctx.visiting.delete(cls.aliasName);
    }
  }
  if (cls.kind === 'recurse-known-args') {
    return cls.args.flatMap(a =>
      'iface' in a ? expandInterface(a.iface, ctx) : renderBranch(a.node, ctx, flattenUnions),
    );
  }
  // recurse-omit: walk the inner project-local type, then drop omitted keys.
  ctx.visiting.add(cls.aliasName);
  try {
    const inner =
      'iface' in cls.target
        ? expandInterface(cls.target.iface, ctx)
        : renderPropsSegments(cls.target.node, ctx, flattenUnions);
    return applyOmit(inner, cls.omit);
  } finally {
    ctx.visiting.delete(cls.aliasName);
  }
}

function renderPropsSegments(propsTypeNode: TypeNode, ctx: ResolveCtx, flattenUnions = false): RenderedSegment[] {
  if (Node.isIntersectionTypeNode(propsTypeNode)) {
    return propsTypeNode.getTypeNodes().flatMap(b => renderBranch(b, ctx, true));
  }
  if (Node.isUnionTypeNode(propsTypeNode)) {
    if (flattenUnions) {
      return propsTypeNode.getTypeNodes().flatMap(m => renderPropsSegments(m, ctx, true));
    }
    const members = propsTypeNode.getTypeNodes();
    const out: RenderedSegment[] = [];
    members.forEach((m, i) => {
      if (i > 0) out.push({ kind: 'spread', text: '(or)' });
      out.push(...renderPropsSegments(m, ctx));
    });
    return out;
  }
  return renderBranch(propsTypeNode, ctx, flattenUnions);
}

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

interface CompoundInfo {
  rootName: string;                                       // e.g. "Form"
  members: Array<{ memberName: string; innerName: string }>; // [{ "Input", "FormInput" }, ...]
}

/**
 * Detect a compound-component shape:
 *   declare const X: typeof XRoot & { A: typeof XA; B: typeof XB; ... };
 * Returns the member list (memberName as accessed: `X.A`, innerName as the
 * inner Props-bearing component: `XA`).
 */
function detectCompound(decls: readonly Node[], rootName: string): CompoundInfo['members'] | null {
  for (const d of decls) {
    if (!Node.isVariableDeclaration(d)) continue;
    const tn = d.getTypeNode();
    if (!tn || !Node.isIntersectionTypeNode(tn)) continue;
    const members: CompoundInfo['members'] = [];
    for (const branch of tn.getTypeNodes()) {
      if (!Node.isTypeLiteral(branch)) continue;
      for (const m of branch.getMembers()) {
        if (!Node.isPropertySignature(m)) continue;
        const memberName = unquoteName(m.getName());
        if (!/^[A-Z]/.test(memberName) || /^[A-Z][A-Z0-9_]*$/.test(memberName)) continue;
        const memberTypeNode = m.getTypeNode();
        if (!memberTypeNode) continue;
        let innerName: string;
        if (memberTypeNode.getKind() === SyntaxKind.TypeQuery) {
          innerName = memberTypeNode.getText().replace(/^typeof\s+/, '').trim();
        } else {
          innerName = rootName + memberName;
        }
        members.push({ memberName, innerName });
      }
    }
    if (members.length > 0) return members;
  }
  return null;
}

function discoverComponents(sf: SourceFile, packageName: string, knownPaths: Set<string>): Component[] {
  // Collect exported names. Use both export-declarations (`export { A, B }`)
  // and the broader getExportedDeclarations() map (catches `export function`).
  const exportNames = new Set<string>();
  for (const ed of sf.getExportDeclarations()) {
    for (const ne of ed.getNamedExports()) exportNames.add(ne.getName());
  }
  for (const k of sf.getExportedDeclarations().keys()) exportNames.add(k);

  // Index local type aliases (whether exported or not) so we can find XxxProps
  // and recurse into private helpers like CommonProps.
  const localTypeAliases = new Map<string, { node: TypeNode; pos: number }>();
  const localTypeAliasNodes = new Map<string, TypeNode>();
  // Same for interface declarations — `interface XxxProps { ... }` is a valid
  // props source alongside `type XxxProps = ...`.
  const localInterfaces = new Map<string, { decl: InterfaceDeclaration; pos: number }>();
  // Track first-seen position for any candidate name (Props alias OR value decl).
  const candidatePositions = new Map<string, number>();
  const recordPos = (name: string, pos: number) => {
    if (!candidatePositions.has(name) || candidatePositions.get(name)! > pos) {
      candidatePositions.set(name, pos);
    }
  };

  for (const child of sf.getChildAtIndex(0).getChildren()) {
    // top-level statements live under the SourceFileSyntaxList; iterate them
  }
  for (const stmt of sf.getStatements()) {
    if (Node.isTypeAliasDeclaration(stmt)) {
      const tn = stmt.getTypeNode();
      if (tn) {
        localTypeAliases.set(stmt.getName(), { node: tn, pos: stmt.getStart() });
        localTypeAliasNodes.set(stmt.getName(), tn);
      }
      const name = stmt.getName();
      if (name.endsWith('Props')) {
        const base = name.slice(0, -'Props'.length);
        if (/^[A-Z]/.test(base) && !/^[A-Z][A-Z0-9_]*$/.test(base)) {
          recordPos(base, stmt.getStart());
        }
      }
    } else if (Node.isInterfaceDeclaration(stmt)) {
      const name = stmt.getName();
      localInterfaces.set(name, { decl: stmt, pos: stmt.getStart() });
      if (name.endsWith('Props')) {
        const base = name.slice(0, -'Props'.length);
        if (/^[A-Z]/.test(base) && !/^[A-Z][A-Z0-9_]*$/.test(base)) {
          recordPos(base, stmt.getStart());
        }
      }
    } else if (Node.isFunctionDeclaration(stmt)) {
      const name = stmt.getName();
      if (name) recordPos(name, stmt.getStart());
    } else if (Node.isVariableStatement(stmt)) {
      for (const d of stmt.getDeclarations()) {
        recordPos(d.getName(), stmt.getStart());
      }
    }
  }

  // Detect compound components first; their inner names get subsumed under
  // the dotted access path (e.g. `Form.Select` replaces a standalone
  // `FormSelect`).
  const compounds: CompoundInfo[] = [];
  const subsumedInners = new Set<string>();
  for (const [name, decls] of sf.getExportedDeclarations().entries()) {
    if (!/^[A-Z]/.test(name) || /^[A-Z][A-Z0-9_]*$/.test(name)) continue;
    const members = detectCompound(decls, name);
    if (members && members.length > 0) {
      compounds.push({ rootName: name, members });
      for (const m of members) subsumedInners.add(m.innerName);
    }
  }

  const candidates = new Set<string>();

  // (a) exported XxxProps types (or local-only XxxProps interfaces, since the
  // discoverer below picks up the value export and we want its props rendered)
  for (const name of exportNames) {
    if (!name.endsWith('Props') || name.length <= 'Props'.length) continue;
    const base = name.slice(0, -'Props'.length);
    if (/^[A-Z]/.test(base) && !/^[A-Z][A-Z0-9_]*$/.test(base)) candidates.add(base);
  }

  // (b) exported PascalCase values (the export list is the source of truth;
  // skip ALL_CAPS constants and exclude type-only exports).
  for (const [name, decls] of sf.getExportedDeclarations().entries()) {
    if (!/^[A-Z]/.test(name)) continue;
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) continue;
    const isValue = decls.some(
      d => Node.isFunctionDeclaration(d) || Node.isVariableDeclaration(d),
    );
    if (isValue) candidates.add(name);
  }

  // Drop subsumed inner names — they surface as `Root.Member` instead.
  for (const inner of subsumedInners) candidates.delete(inner);

  const components: Component[] = [];
  const ctx: ResolveCtx = {
    localTypeAliases: localTypeAliasNodes,
    exportNames,
    visiting: new Set(),
    knownPaths,
  };
  for (const name of candidates) {
    const propsAlias = localTypeAliases.get(`${name}Props`);
    const propsIface = localInterfaces.get(`${name}Props`);
    components.push({
      name,
      pkg: packageName,
      propsTypeNode: propsAlias?.node,
      propsInterface: propsIface?.decl,
      position: candidatePositions.get(name) ?? Infinity,
      ctx,
    });
  }
  // Compound members: emit `[Root.Member]` immediately after `[Root]`,
  // preserving member-declaration order. Tiny epsilon offsets keep them
  // grouped after the root in the final sort.
  for (const compound of compounds) {
    const rootPos = candidatePositions.get(compound.rootName) ?? Infinity;
    compound.members.forEach((m, i) => {
      const propsAlias = localTypeAliases.get(`${m.innerName}Props`);
      const propsIface = localInterfaces.get(`${m.innerName}Props`);
      components.push({
        name: `${compound.rootName}.${m.memberName}`,
        pkg: packageName,
        propsTypeNode: propsAlias?.node,
        propsInterface: propsIface?.decl,
        position: rootPos + (i + 1) / 1000,
        ctx,
      });
    });
  }
  components.sort((a, b) => a.position - b.position);
  return components;
}

export function discoverComponentsForPackage(
  pkg: PackageEntry,
  sources: SourceFile[],
): Component[] {
  const knownPaths = new Set(sources.map(sf => sf.getFilePath()));
  const out: Component[] = [];
  for (const sf of sources) {
    out.push(...discoverComponents(sf, pkg.name, knownPaths));
  }
  return out;
}

export function dedupeComponents(
  comps: Component[],
  warn: (msg: string) => void = msg => process.stderr.write(msg + '\n'),
): Component[] {
  const seen = new Map<string, Component>();
  for (const c of comps) {
    const prior = seen.get(c.name);
    if (prior) {
      if (prior.pkg !== c.pkg) {
        warn(`Warning: \`${c.name}\` is exported by both \`${prior.pkg}\` and \`${c.pkg}\`; using \`${prior.pkg}\`.`);
        continue;
      }
      const priorHasProps = !!(prior.propsTypeNode || prior.propsInterface);
      const currHasProps = !!(c.propsTypeNode || c.propsInterface);
      if (!priorHasProps && currHasProps) {
        seen.set(c.name, c);
      }
      continue;
    }
    seen.set(c.name, c);
  }
  // Drop flattened names that are subsumed by a dot-notation compound member.
  // e.g., if both `ActionList.Item` and `ActionListItem` exist, keep only the
  // dot-notation form — it matches how adopters actually write code.
  const dotNames = new Set<string>();
  for (const name of seen.keys()) {
    if (name.includes('.')) dotNames.add(name);
  }
  for (const dotName of dotNames) {
    const flat = dotName.replace('.', '');
    if (seen.has(flat)) {
      const dotComp = seen.get(dotName)!;
      const flatComp = seen.get(flat)!;
      // Merge props: if the dot-notation entry lacks props but the flattened
      // one has them, transfer before dropping.
      const dotHasProps = !!(dotComp.propsTypeNode || dotComp.propsInterface);
      const flatHasProps = !!(flatComp.propsTypeNode || flatComp.propsInterface);
      if (!dotHasProps && flatHasProps) {
        dotComp.propsTypeNode = flatComp.propsTypeNode;
        dotComp.propsInterface = flatComp.propsInterface;
        dotComp.ctx = flatComp.ctx;
      }
      seen.delete(flat);
    }
  }
  return [...seen.values()];
}

interface RenderedAtom {
  name: string;
  pkg: string;
  spreads: string[];
  shape: AtomShape;
}

type AtomShape =
  | { kind: 'no-props' }
  | { kind: 'props'; props: RenderedProp[] }
  | { kind: 'variants'; variants: RenderedProp[][] }
  | { kind: 'variants-with-shared'; shared: RenderedProp[]; variants: RenderedProp[][] };

function dedupeProps(props: RenderedProp[]): void {
  const seen = new Set<string>();
  let write = 0;
  for (let read = 0; read < props.length; read++) {
    const key = props[read].name;
    if (seen.has(key)) continue;
    seen.add(key);
    props[write++] = props[read];
  }
  props.length = write;
}

function segmentsToAtom(comp: Component, segments: RenderedSegment[]): RenderedAtom {
  const firstOr = segments.findIndex(s => s.kind === 'spread' && s.text === '(or)');
  if (firstOr !== -1) {
    const sharedProps: RenderedProp[] = [];
    const spreads: string[] = [];
    for (const seg of segments.slice(0, firstOr)) {
      if (seg.kind === 'spread') spreads.push(seg.text);
      else sharedProps.push(...seg.props);
    }
    const variants: RenderedProp[][] = [];
    for (const seg of segments.slice(firstOr)) {
      if (seg.kind === 'spread' && seg.text === '(or)') {
        variants.push([]);
        continue;
      }
      if (seg.kind === 'spread') {
        spreads.push(seg.text);
        continue;
      }
      if (variants.length === 0) variants.push([]);
      variants[variants.length - 1].push(...seg.props);
    }
    const nonEmpty = variants.filter(v => v.length > 0);
    // If every variant prop name already appears in shared, the variants only
    // refine existing props — fold back into flat props, merging type values.
    const sharedNames = new Set(sharedProps.map(p => p.name));
    const allSubsumed = nonEmpty.length === 0 || nonEmpty.every(v => v.every(p => sharedNames.has(p.name)));
    if (allSubsumed) {
      // Merge variant type values into the shared prop's type.
      const sharedByName = new Map(sharedProps.map(p => [p.name, p]));
      for (const v of nonEmpty) {
        for (const vp of v) {
          const sp = sharedByName.get(vp.name);
          if (!sp) continue;
          if (sp.type.kind === 'union' && vp.type.kind === 'union') {
            const merged = new Set(sp.type.values);
            for (const val of vp.type.values) merged.add(val);
            sp.type = { kind: 'union', values: [...merged] };
          }
        }
      }
      dedupeProps(sharedProps);
      if (sharedProps.length === 0 && spreads.length === 0) {
        return { name: comp.name, pkg: comp.pkg, spreads: [], shape: { kind: 'no-props' } };
      }
      return { name: comp.name, pkg: comp.pkg, spreads, shape: { kind: 'props', props: sharedProps } };
    }
    if (sharedProps.length > 0) {
      return { name: comp.name, pkg: comp.pkg, spreads, shape: { kind: 'variants-with-shared', shared: sharedProps, variants: nonEmpty } };
    }
    return { name: comp.name, pkg: comp.pkg, spreads, shape: { kind: 'variants', variants: nonEmpty } };
  }
  const props: RenderedProp[] = [];
  const spreads: string[] = [];
  for (const seg of segments) {
    if (seg.kind === 'spread') spreads.push(seg.text);
    else props.push(...seg.props);
  }
  dedupeProps(props);
  if (props.length === 0 && spreads.length === 0) {
    return { name: comp.name, pkg: comp.pkg, spreads: [], shape: { kind: 'no-props' } };
  }
  return { name: comp.name, pkg: comp.pkg, spreads, shape: { kind: 'props', props } };
}

const YAML_SAFE_BAREWORD = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TYPE_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/\bboolean\b/g, 'bool'],
  [/\bReact\.ReactNode\b/g, 'ReactNode'],
];

function normalizeTypeText(text: string): string {
  let out = text;
  for (const [re, sub] of TYPE_NORMALIZATIONS) out = out.replace(re, sub);
  return out;
}

function quoteYamlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function isFunctionType(text: string): boolean {
  return /=>/.test(text);
}

function renderResolvedType(rt: ResolvedType): string {
  if (rt.kind === 'union') {
    const inner = rt.values.map(v => YAML_SAFE_BAREWORD.test(v) ? v : quoteYamlString(v)).join(', ');
    return `[${inner}]`;
  }
  const normalized = normalizeTypeText(rt.text);
  if (isFunctionType(normalized)) return quoteYamlString(normalized);
  if (YAML_SAFE_BAREWORD.test(normalized) || /^[A-Za-z_][A-Za-z0-9_<>,\s]*$/.test(normalized)) {
    return normalized;
  }
  return quoteYamlString(normalized);
}

function renderSpread(text: string): string {
  const normalized = normalizeTypeText(text);
  if (/^[A-Za-z_][A-Za-z0-9_<>.]*$/.test(normalized)) return normalized;
  return quoteYamlString(normalized);
}

function renderPropLines(props: RenderedProp[], indent: string): string[] {
  return props.map(p => {
    const key = `${p.name}${p.optional ? '?' : ''}`;
    return `${indent}${key}: ${renderResolvedType(p.type)}`;
  });
}

function renderAtom(atom: RenderedAtom): string {
  if (atom.shape.kind === 'no-props' && atom.spreads.length === 0) {
    return `${atom.name}: { pkg: ${quoteYamlString(atom.pkg)} }`;
  }
  const lines: string[] = [`${atom.name}:`, `  pkg: ${quoteYamlString(atom.pkg)}`];
  if (atom.spreads.length > 0) {
    lines.push(`  spreads: [${atom.spreads.map(renderSpread).join(', ')}]`);
  }
  if (atom.shape.kind === 'props') {
    lines.push(...renderPropLines(atom.shape.props, '  '));
  } else if (atom.shape.kind === 'variants' || atom.shape.kind === 'variants-with-shared') {
    if (atom.shape.kind === 'variants-with-shared') {
      lines.push(...renderPropLines(atom.shape.shared, '  '));
    }
    lines.push(`  variants:`);
    const variants = atom.shape.kind === 'variants-with-shared' ? atom.shape.variants : atom.shape.variants;
    for (const variant of variants) {
      if (variant.length === 0) {
        lines.push(`    - {}`);
        continue;
      }
      const first = variant[0];
      const firstKey = `${first.name}${first.optional ? '?' : ''}`;
      lines.push(`    - ${firstKey}: ${renderResolvedType(first.type)}`);
      for (let i = 1; i < variant.length; i++) {
        const p = variant[i];
        const key = `${p.name}${p.optional ? '?' : ''}`;
        lines.push(`      ${key}: ${renderResolvedType(p.type)}`);
      }
    }
  }
  return lines.join('\n');
}

export function renderFact(components: Component[], tokens: string[]): string {
  const lines: string[] = [];
  lines.push('<!-- AUTO-GENERATED by the Pastiche FACT extractor. Do not edit by hand. -->');
  lines.push('<!-- Components: YAML map keyed by atom name (`Atom:` at column 0); read lazily by atom-name grep. Tokens: flat lines (no bullets); read whole. -->');
  lines.push('');
  lines.push('## Components');
  lines.push('');
  lines.push('```yaml');
  for (const comp of components) {
    const segments = comp.propsTypeNode
      ? renderPropsSegments(comp.propsTypeNode, comp.ctx)
      : comp.propsInterface
        ? expandInterface(comp.propsInterface, comp.ctx)
        : [];
    const atom = segmentsToAtom(comp, segments);
    lines.push(renderAtom(atom));
  }
  lines.push('```');
  lines.push('');
  lines.push('## Tokens');
  lines.push('');
  for (const t of tokens) lines.push(t);
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// main() — composes the pipeline; filled in fully by Task 11
// ---------------------------------------------------------------------------

function main(): void {
  const cwd = process.cwd();
  let cfg: Config;
  try {
    cfg = loadConfig(cwd);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(msg + '\n');
    process.exit(1);
  }

  const { packageSources } = buildProject(cfg, cwd);
  const allComps: Component[] = [];
  for (const pkg of cfg.packages) {
    const sources = packageSources.get(pkg.name)!;
    allComps.push(...discoverComponentsForPackage(pkg, sources));
  }
  const deduped = dedupeComponents(allComps);
  const tokens = extractTokens(cfg.tokens, cwd);
  const fact = renderFact(deduped, tokens);

  const factPath = path.join(cwd, 'pastiche', 'FACT.md');
  fs.mkdirSync(path.dirname(factPath), { recursive: true });
  fs.writeFileSync(factPath, fact, 'utf8');
  process.stdout.write(
    `Wrote pastiche/FACT.md: ${deduped.length} components, ${tokens.length} tokens.\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
