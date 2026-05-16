/**
 * Pastiche FACT extractor.
 *
 * Reads pastiche/pastiche.config.yaml, walks the configured package .d.ts
 * files plus the theme CSS, and writes a flat catalog (FACT.md) of every
 * exported component (with its props) and every CSS theme token. Mechanical
 * only — no LLM, no source-tree reads beyond what the config points at.
 *
 * Component rendering rule:
 *   - One section per component name, where a "component name" is either:
 *       (a) an exported XxxProps type alias (component name = strip "Props"), or
 *       (b) an exported PascalCase value whose type contains JSX.Element /
 *           ReactElement / ForwardRefExoticComponent.
 *   - Props body: walk the XxxProps type alias node by node.
 *       * Intersection branches that resolve to a node_modules-defined type, or
 *         to Omit<...> / Pick<...> of one, are rendered as `...<branchText>`.
 *       * Inline object literals and VariantProps<typeof X> are expanded into
 *         named props via the type checker (so cva variant unions surface).
 *       * Components without an XxxProps alias get a stub (package + exports).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Project,
  Node,
  SyntaxKind,
  type InterfaceDeclaration,
  type SourceFile,
  type TypeNode,
} from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// pastiche/pastiche.config.yaml (hand-parsed; tiny known schema)
//
// FACT.md is written to the convention path `pastiche/FACT.md` — not
// configurable.
// ---------------------------------------------------------------------------

const PASTICHE_DIR = path.join(REPO_ROOT, 'pastiche');
const FACT_PATH = path.join(PASTICHE_DIR, 'FACT.md');

interface Config {
  packages: Record<string, { types: string }>;
  tokens: { source: string };
}

function readConfig(): Config {
  const text = fs.readFileSync(path.join(PASTICHE_DIR, 'pastiche.config.yaml'), 'utf8');
  const cfg: Config = { packages: {}, tokens: { source: '' } };
  let section: string | null = null;
  let pkg: string | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').replace(/\s+$/, '');
    if (!line.trim()) continue;
    if (/^[a-z]+:\s*$/i.test(line)) {
      section = line.replace(':', '').trim();
      pkg = null;
      continue;
    }
    if (section === 'packages' && /^\s\s"/.test(line)) {
      pkg = line.match(/"([^"]+)"/)![1];
      cfg.packages[pkg] = { types: '' };
      continue;
    }
    if (section === 'packages' && pkg && /^\s{4}types:/.test(line)) {
      cfg.packages[pkg].types = line.split(':').slice(1).join(':').trim();
      continue;
    }
    if (section === 'tokens' && /^\s\ssource:/.test(line)) {
      cfg.tokens.source = line.split(':').slice(1).join(':').trim();
    }
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Token extraction (only @theme { ... } block bodies)
// ---------------------------------------------------------------------------

/**
 * Extract design tokens from the configured CSS file. Two kinds:
 *   1. `--*` custom properties declared inside `@theme { ... }` blocks.
 *   2. Class selectors (`.type-h1`, `.ds-spinner-sm`) declared anywhere —
 *      these are utility-class atoms the implementer references via
 *      `className="..."`, treated as tokens for FACT purposes.
 */
function extractTokens(cssPath: string): string[] {
  const raw = fs.readFileSync(cssPath, 'utf8');
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  const seen = new Set<string>();
  const emit = (n: string) => {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  // (1) --* inside @theme { ... }
  const themeRe = /@theme\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = themeRe.exec(css))) {
    for (const line of m[1].split('\n')) {
      const tm = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:/);
      if (tm) emit(tm[1]);
    }
  }

  // (2) Class selectors. Walk char-by-char: each `{` closes a selector, `}`
  // and `;` reset the selector start. Skip any selector starting with `@`
  // (at-rule preamble like `@media`, `@keyframes`, `@theme`).
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

  return out;
}

// ---------------------------------------------------------------------------
// Type classification + rendering
// ---------------------------------------------------------------------------

interface ResolveCtx {
  /** Type aliases declared in the current source file (exported or not). */
  localTypeAliases: Map<string, TypeNode>;
  /** Names that appear in the current source file's exports. */
  exportNames: Set<string>;
  /** Recursion guard: aliases currently being expanded. */
  visiting: Set<string>;
}

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

function renderSpread(text: string): string {
  // Sentinel for union separator — render bare, not as `...(or)`.
  if (text === '(or)') return '  --- or ---';
  return `  ...${text}`;
}

function renderSegments(segments: RenderedSegment[]): string {
  const allProps = segments.flatMap(s => (s.kind === 'expand' ? s.props : []));
  if (allProps.length === 0) {
    return segments.map(s => renderSpread((s as { text: string }).text)).join('\n');
  }
  const nameCells = allProps.map(p => `${p.name}${p.optional ? '?' : ''}:`);
  const nameWidth = Math.max(...nameCells.map(c => c.length));
  const lines: string[] = [];
  let i = 0;
  for (const seg of segments) {
    if (seg.kind === 'spread') {
      lines.push(renderSpread(seg.text));
      continue;
    }
    for (const p of seg.props) {
      const cell = nameCells[i++];
      const padded = cell + ' '.repeat(nameWidth - cell.length + 1);
      const tail = p.optional ? '' : '   (required)';
      lines.push(`  ${padded}${p.typeText}${tail}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

interface Component {
  name: string;
  package: string;
  propsTypeNode?: TypeNode;
  propsInterface?: InterfaceDeclaration;
  position: number;
  ctx: ResolveCtx;
}

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
      package: packageName,
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
        package: packageName,
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const cfg = readConfig();
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

  const out: string[] = [];
  out.push('<!-- AUTO-GENERATED by the Pastiche FACT extractor. Do not edit by hand. -->');
  out.push('<!-- Components: addressed by [AtomName], read lazily. Tokens: flat list, always loaded. -->');
  out.push('<!-- Each [X] section implies `X` and (when present) `XProps` / `xVariants` are exported from its package. -->');
  out.push('');

  let componentCount = 0;
  for (const [pkgName, { types }] of Object.entries(cfg.packages)) {
    const absPath = path.resolve(REPO_ROOT, types);
    const sf = project.addSourceFileAtPath(absPath);
    const comps = discoverComponents(sf, pkgName);
    for (const comp of comps) {
      out.push(`### [${comp.name}]`);
      out.push(`package: ${comp.package}`);
      if (comp.propsTypeNode) {
        out.push('');
        out.push('Props:');
        out.push(renderSegments(renderProps(comp.propsTypeNode, comp.ctx)));
      } else if (comp.propsInterface) {
        out.push('');
        out.push('Props:');
        out.push(renderSegments(expandInterface(comp.propsInterface, comp.ctx)));
      }
      out.push('');
      componentCount++;
    }
  }

  out.push('## Tokens');
  out.push('');
  const tokens = extractTokens(path.resolve(REPO_ROOT, cfg.tokens.source));
  for (const t of tokens) out.push(`- ${t}`);

  fs.mkdirSync(path.dirname(FACT_PATH), { recursive: true });
  fs.writeFileSync(FACT_PATH, out.join('\n') + '\n', 'utf8');
  process.stdout.write(
    `Wrote ${path.relative(REPO_ROOT, FACT_PATH)}: ${componentCount} components, ${tokens.length} tokens.\n`,
  );
}

main();
