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
      const abs = path.resolve(cwd, pkg.types);
      sources.push(project.addSourceFileAtPath(abs));
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
      if (!Node.isLiteralTypeNode(m)) return null;
      const lit = m.getLiteral();
      if (!Node.isStringLiteral(lit)) return null;
      out.add(lit.getLiteralValue());
    }
    return out;
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
    if (d.getSourceFile().getFilePath().includes('/node_modules/')) continue;
    if (Node.isTypeAliasDeclaration(d)) {
      const tn = d.getTypeNode();
      if (tn) return { target: { node: tn }, aliasName };
    }
    if (Node.isInterfaceDeclaration(d)) {
      return { target: { iface: d }, aliasName };
    }
  }
  return null;
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
    if (decls.length === 0) return { kind: 'spread' };
    const fp = decls[0].getSourceFile().getFilePath();
    if (fp.includes('/node_modules/')) return { kind: 'spread' };
    // Local exported type (e.g., another component's Props) → spread; the
    // reader will look it up by atom name.
    return { kind: 'spread' };
  }
  return { kind: 'expand' };
}

interface RenderedProp {
  name: string;
  optional: boolean;
  typeText: string;
}
type RenderedSegment =
  | { kind: 'spread'; text: string }
  | { kind: 'expand'; props: RenderedProp[] };

const NULL_UNDEFINED_RE = /\s*\|\s*null\s*\|\s*undefined\s*$|\s*\|\s*undefined\s*$|\s*\|\s*null\s*$/;

function cleanTypeText(s: string): string {
  let out = s.trim();
  // strip trailing | null | undefined / | undefined / | null repeatedly
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
const MAX_UNION_INLINE = 100;
function maybeInlineLiteralUnion(tn: TypeNode, ctx: ResolveCtx): string | null {
  if (!Node.isTypeReference(tn)) return null;
  const refName = tn.getTypeName().getText();
  const alias = ctx.localTypeAliases.get(refName);
  if (alias) {
    const isLitNode = (n: TypeNode) => Node.isLiteralTypeNode(n);
    if (isLitNode(alias)) return cleanTypeText(alias.getText());
    if (Node.isUnionTypeNode(alias) && alias.getTypeNodes().every(isLitNode)) {
      return cleanTypeText(alias.getText());
    }
  }
  // Type-checker fallback: resolve `keyof typeof X`, mapped types, enums, etc.
  const t = tn.getType();
  if (t.isUnion()) {
    const parts = t.getUnionTypes();
    if (parts.length > 0 && parts.length <= MAX_UNION_INLINE && parts.every(p => p.isLiteral())) {
      return parts.map(p => p.getText()).join(' | ');
    }
  }
  // Mixed-shape local alias (e.g. `type GridColumns = number | { ... }`) — the
  // alias name is invisible to the FACT reader, so inline the alias RHS text.
  // Collapse internal whitespace so multi-line object literals render on one
  // line and the props table stays column-aligned. One level only; nested
  // local refs stay as names (rare, accepted).
  if (alias) return cleanTypeText(alias.getText()).replace(/\s+/g, ' ');
  return null;
}

function propTypeText(tn: TypeNode | undefined, fallback: string, ctx: ResolveCtx): string {
  if (tn) {
    const inlined = maybeInlineLiteralUnion(tn, ctx);
    if (inlined) return inlined;
    return cleanTypeText(tn.getText());
  }
  return cleanTypeText(fallback);
}

function expandTypeNode(node: TypeNode, ctx: ResolveCtx): RenderedProp[] {
  const out: RenderedProp[] = [];
  if (Node.isTypeLiteral(node)) {
    for (const m of node.getMembers()) {
      if (!Node.isPropertySignature(m)) continue;
      const name = unquoteName(m.getName());
      const optional = m.hasQuestionToken();
      const tn = m.getTypeNode();
      const typeText = propTypeText(tn, m.getType().getText(node), ctx);
      out.push({ name, optional, typeText });
    }
    return out;
  }
  // Resolve via type checker (e.g., VariantProps<...>)
  const t = node.getType();
  for (const sym of t.getProperties()) {
    const decls = sym.getDeclarations();
    const decl = decls[0];
    let optional = (sym.getFlags() & 16777216) !== 0; // SymbolFlags.Optional
    let typeText: string;
    if (decl && Node.isPropertySignature(decl)) {
      optional = optional || decl.hasQuestionToken();
      const tn = decl.getTypeNode();
      typeText = propTypeText(tn, sym.getTypeAtLocation(node).getText(node), ctx);
    } else {
      typeText = cleanTypeText(sym.getTypeAtLocation(node).getText(node));
    }
    out.push({
      name: unquoteName(sym.getName()),
      optional,
      typeText,
    });
  }
  return out;
}

function expandInterface(decl: InterfaceDeclaration, ctx: ResolveCtx): RenderedSegment[] {
  const segments: RenderedSegment[] = [];
  for (const heritage of decl.getExtends()) {
    segments.push({ kind: 'spread', text: heritage.getText() });
  }
  const props: RenderedProp[] = [];
  for (const m of decl.getMembers()) {
    if (!Node.isPropertySignature(m)) continue;
    const name = unquoteName(m.getName());
    const optional = m.hasQuestionToken();
    const tn = m.getTypeNode();
    const typeText = propTypeText(tn, m.getType().getText(decl), ctx);
    props.push({ name, optional, typeText });
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

function renderBranch(branch: TypeNode, ctx: ResolveCtx): RenderedSegment[] {
  const cls = classifyBranch(branch, ctx);
  if (cls.kind === 'spread') return [{ kind: 'spread', text: branch.getText() }];
  if (cls.kind === 'expand') return [{ kind: 'expand', props: expandTypeNode(branch, ctx) }];
  if (cls.kind === 'recurse') {
    if (cls.aliasName) ctx.visiting.add(cls.aliasName);
    try {
      return renderProps(cls.node, ctx);
    } finally {
      if (cls.aliasName) ctx.visiting.delete(cls.aliasName);
    }
  }
  // recurse-omit: walk the inner project-local type, then drop omitted keys.
  ctx.visiting.add(cls.aliasName);
  try {
    const inner =
      'iface' in cls.target
        ? expandInterface(cls.target.iface, ctx)
        : renderProps(cls.target.node, ctx);
    return applyOmit(inner, cls.omit);
  } finally {
    ctx.visiting.delete(cls.aliasName);
  }
}

function renderProps(propsTypeNode: TypeNode, ctx: ResolveCtx): RenderedSegment[] {
  if (Node.isIntersectionTypeNode(propsTypeNode)) {
    return propsTypeNode.getTypeNodes().flatMap(b => renderBranch(b, ctx));
  }
  if (Node.isUnionTypeNode(propsTypeNode)) {
    // Walk each union member as its own group, separated by an `(or)` marker.
    const members = propsTypeNode.getTypeNodes();
    const out: RenderedSegment[] = [];
    members.forEach((m, i) => {
      if (i > 0) out.push({ kind: 'spread', text: '(or)' });
      out.push(...renderProps(m, ctx));
    });
    return out;
  }
  return renderBranch(propsTypeNode, ctx);
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
function detectCompound(decls: readonly Node[]): CompoundInfo['members'] | null {
  for (const d of decls) {
    if (!Node.isVariableDeclaration(d)) continue;
    const tn = d.getTypeNode();
    if (!tn || !Node.isIntersectionTypeNode(tn)) continue;
    const members: CompoundInfo['members'] = [];
    for (const branch of tn.getTypeNodes()) {
      if (!Node.isTypeLiteral(branch)) continue;
      for (const m of branch.getMembers()) {
        if (!Node.isPropertySignature(m)) continue;
        const memberTypeNode = m.getTypeNode();
        if (!memberTypeNode) continue;
        if (memberTypeNode.getKind() !== SyntaxKind.TypeQuery) continue;
        const innerName = memberTypeNode.getText().replace(/^typeof\s+/, '').trim();
        members.push({
          memberName: unquoteName(m.getName()),
          innerName,
        });
      }
    }
    if (members.length > 0) return members;
  }
  return null;
}

function discoverComponents(sf: SourceFile, packageName: string): Component[] {
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
    const members = detectCompound(decls);
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
  const out: Component[] = [];
  for (const sf of sources) {
    out.push(...discoverComponents(sf, pkg.name));
  }
  return out;
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
