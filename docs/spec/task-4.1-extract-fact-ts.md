# Task 4.1 — Promote FACT extractor to `scripts/extract-fact-ts.ts`

Spec for TODO task 4.1: promote `_dev/scripts/extract-fact.ts` into the project-agnostic, plugin-bundled FACT extractor. Inherits from `docs/spec/phase-4-scripts.md` and amends `docs/spec/task-2.4-config-template.md` decisions 14, 15, and 21.

## Scope

- Author `scripts/extract-fact-ts.ts` as the generalized extractor, supporting both `types` (aggregate `.d.ts`) and `source_dir` (source-walk) package modes, a unified CSS token parser, **and the new FACT output format mandated by phase-2 §3** (see decision 14 below).
- Author `scripts/extract-fact-ts.test.ts` covering the five buckets locked under decision 10.
- Add the `yaml` npm package as a dependency (authoring a minimal `package.json` if one does not yet exist at the repo root).
- Amend `docs/spec/task-2.4-config-template.md` decisions 14, 15, and 21 in the same commit to reflect the simpler schema locked in this grill. *(shipped in commit 16978c5)*
- Amend `_dev/docs/OSS_SPEC.md` §9.4 and §9.4.1 in the same commit (`format`, `selectors`, `extensions` removed; `tokens` becomes a list of CSS file paths; four stack scenarios rewritten). *(shipped in commit 16978c5)*
- Add an "Amendments" note in `docs/spec/phase-4-scripts.md` pointing to the above. *(shipped in commit 16978c5)*
- Delete `_dev/scripts/extract-fact.ts` in the same commit as the source port per Rule 5 (phase-4 spec decision 7).

## Locked decisions

### 1. Amend the 2.4-locked config schema in this task

The 2.4 schema is amended in the same commit as this task's source ports. `tokens` is no longer a list of `{format, source, selectors?}` and `source_dir` package entries no longer carry an `extensions` field. The amendment list above is the canonical surface.

### 2. `tokens` shape: always a list of path strings

`tokens` in `pastiche/config.yaml` is a YAML list of CSS file paths (strings). Single-file consumers still write a one-element list — there is no scalar shorthand. No per-entry `format`, no per-entry `selectors`, no per-entry objects.

### 3. `packages` shape: locked 2.4 shape minus `extensions`

`packages` remains a YAML list of `{name, types | source_dir}` objects. `name` is required and unique across entries. Exactly one of `types` or `source_dir` per entry. The `extensions` optional sub-field is removed; `.tsx` and `.ts` are hard-coded as the source-walk extensions (decision 5).

### 4. YAML parser: `yaml` npm package

The extractor uses the `yaml` npm package to parse `pastiche/config.yaml`. The hand-rolled parser from `_dev/scripts/extract-fact.ts` is not carried forward.

### 5. `source_dir` walk: recursive DFS, hard-coded extensions, sidecar exclusions

Source-walk mode performs a recursive depth-first walk of the configured directory. The collected file list is sorted before processing to guarantee deterministic output across machines and filesystems. Only files with `.tsx` or `.ts` extensions are included; `.jsx`, `.js`, and `.d.ts` files are excluded. Files matching `*.test.{ts,tsx}`, `*.stories.{ts,tsx}`, or `*.spec.{ts,tsx}` are skipped.

### 6. CSS parsing: simple unified regex parser

The CSS token parser is hand-rolled and dependency-free. Custom-property names are harvested by a single regex over the whole file body (after stripping `/* ... */` comments), regardless of which block they appear in — `@theme { ... }`, `:root { ... }`, `[data-theme="dark"] { ... }`, and any other selector are all handled by the same pass. Class selectors are harvested by the existing character-walk approach. PostCSS is not introduced in v1.

### 7. Invocation model: zero-arg, CWD-rooted

The extractor takes no CLI arguments. It reads `./pastiche/config.yaml` from the current working directory and writes `./pastiche/FACT.md` to the current working directory. Paths inside the config (`packages[].types`, `packages[].source_dir`, `tokens[]`) are resolved relative to CWD, not relative to the config file's location. The script never inspects its own install location; the plugin path is opaque to it. Skill bodies are responsible for being in the adopter's repo before invoking the script.

### 8. Error behavior

If `./pastiche/config.yaml` does not exist, the extractor exits with code 1 and an actionable stderr message naming the missing file and recommending `/pastiche-init`. The output file is overwritten in place via a plain write — no atomic-write dance.

### 9. Library + guarded `main()` export surface

The script is authored as a library with a guarded `main()` entry. Exported pipeline stages: `loadConfig`, `buildProject`, `discoverComponentsForPackage`, `extractTokens`, `renderFact`, plus the data shapes those functions consume and return. Internal helpers (`classifyBranch`, `expandTypeNode`, `maybeInlineLiteralUnion`, etc.) stay file-local. The `main()` guard uses the standard `import.meta.url === \`file://${process.argv[1]}\`` idiom.

### 10. Test strategy

Tests live at `scripts/extract-fact-ts.test.ts` colocated with source, using `node:test` + `node:assert/strict` (matching the existing `_dev/scripts/lint-tags.test.ts` pattern). Unit tests use in-memory inputs where possible — strings for CSS, ts-morph `project.createSourceFile('virtual.tsx', '<source>')` for components. One end-to-end integration test runs against a tiny disk fixture under `scripts/__fixtures__/` covering source-walk mode. Coverage scope shipped in 4.1 (the "five buckets"):

1. Token extraction: `:root` block, `@theme` block, multi-file dedup, class selector harvesting, comment stripping.
2. Source-walk: recursive DFS, file ordering determinism, test/stories/spec skipping.
3. Component discovery: at least one source-walk component renders correctly end-to-end.
4. Config loading: malformed YAML produces a clear error; missing config exits 1; both `types` and `source_dir` shapes parse.
5. Error paths: missing referenced file in config produces an actionable error.

Broader coverage is deferred to Phase 6.7 field-testing.

### 11. ts-morph Project assembly

Compiler options are hard-coded in the script (`target: ESNext`, `module: ESNext`, `moduleResolution: Bundler`, `allowJs: false`, `skipAddingFilesFromTsConfig: true`). The adopter's `tsconfig.json` is **not** read; `paths` aliases and custom `typeRoots` are not honored in v1. All packages share a single `Project` instance so cross-package type references resolve. Type-check errors in adopter source are ignored — the extractor falls back to syntactic text when resolution fails.

### 12. Cross-package and cross-file dedup

Components: first-listed package wins on duplicate component-name exports. The collision is logged to stderr as a non-fatal warning naming both packages. Tokens: first-encountered name wins across multiple CSS files; collisions are silent (cascade order does not affect FACT output, which carries names only).

### 13. Extractor-side validation: minimal

Schema validation is lint's responsibility (Phase 4.2). The extractor re-validates only the subset it must to fail with actionable errors instead of an unhelpful stack trace: (a) every file referenced in `packages[].types`, `packages[].source_dir`, and `tokens[]` exists on disk; (b) each `packages` entry has exactly one of `types` or `source_dir`. All other validations (name uniqueness, required-field non-emptiness, platform enum, etc.) stay in lint's lane.

### 14. FACT output format follows phase-2 §3 (post-grill amendment, 2026-05-22)

> **Amendment note:** This decision was not surfaced during the original 4.1 grill but was uncovered during plan writing. Phase-2 §3 (task 2.1) already mandated a new FACT shape and explicitly assigned the extractor's emission of that shape to Phase 4.1 (phase-2 spec line 69). The agents shipped under tasks 1.2/1.3/1.4/2.8 grep against the new shape (`^Atom:` anchor). Format conversion must ship in lockstep with the schema generalization in this same task; splitting them would leave `/pastiche-sync` producing FACT files that every implementer agent grep would fail against.

The extractor emits the new FACT shape as defined in `docs/spec/phase-2-templates-and-skills.md` §3. Concretely:

- **Components section** wrapped in a fenced ```` ```yaml ``` ```` block under an `## Components` H2.
- **Atom key** at column 0: `Button:` (replaces `### [Button]`).
- **`pkg:` field** (replaces `package:`) — quoted when the package name contains characters YAML would otherwise interpret (`@`, `/`).
- **`spreads:` field** — YAML list of extension/spread type-text values (replaces the `...React.HTMLAttributes<...>` lines previously emitted inline). Items are bareword when YAML-safe inside a flow sequence, quoted otherwise.
- **Props as direct children** of the atom key (no nested `Props:` block). Required by default; `?` suffix on the key marks optional.
- **Literal-union props** rendered as YAML flow arrays of bareword values: `size?: [sm, md, lg]`. Replaces the pipe-union `"sm" | "md" | "lg"` text. Applies to string-literal unions and other unions the type checker collapses to a finite literal set; the existing `maybeInlineLiteralUnion` resolver already identifies these.
- **Function-type props** rendered as quoted strings: `onChange?: "(v: string) => void"`.
- **Discriminated unions** rendered as a `variants:` list of prop-map records (replaces the `(or)` separator the existing renderer used).
- **Type-text normalizations** applied uniformly to rendered values: `boolean` → `bool`; `React.ReactNode` → `ReactNode`. Other normalizations are not introduced in v1.
- **No-props atoms** collapse to one-line YAML flow: `Avatar: { pkg: "@org/x" }`.
- **Tokens section** — flat lines, one token per line, no `- ` bullet prefix. Replaces the existing bulleted list. `## Tokens` H2 unchanged.
- **Top-of-file banner** retained as HTML comment(s); the existing extractor's three-comment banner stays in shape.

Quoting policy (implementation guidance, not over-specification): values whose text is a YAML-safe identifier (matching `[A-Za-z_][A-Za-z0-9_.-]*`, no leading sigil, not containing YAML special chars) emit bareword; all other values are double-quoted. Errs on the side of quoting for ambiguous cases — output is consumed by `grep -E`, not by a YAML parser, so over-quoting is harmless to readers and lint validators alike.

### 15. Test coverage adds format-shape buckets (post-grill amendment, 2026-05-22)

The five coverage buckets in decision 10 are extended with format-shape assertions. The bucket count remains "five" conceptually; the third bucket ("Component discovery") absorbs the format assertions because rendering is the component pipeline's tail stage. Concretely the third bucket now also covers:

- An atom with `?`-marked optional and required props rendering correctly.
- An atom with a literal-union prop rendering as a YAML flow array of barewords.
- An atom with a function-type prop rendering as a quoted string.
- An atom with `boolean` and `React.ReactNode` props rendering as `bool` and `ReactNode`.
- An atom with spreads rendering a `spreads:` list (and no inline `...` lines).
- A no-props atom rendering as one-line flow.
- The tokens section rendering as un-bulleted lines.

Discriminated unions (`variants:` list) are exercised in the end-to-end fixture rather than as a standalone unit case — they require a meaningful surrounding type.

### 16. Out of scope

The following are explicitly out of scope for this commit:

- Bundling the script to `dist/extract-fact.js` (Phase 7.1).
- The lint script and KNOWLEDGE-section-presence enforcement (Phase 4.2).
- `/pastiche-sync` and `/pastiche-init` skill bodies that invoke the script (Phase 5, which needs its own pivot-alignment grill per phase-4 spec).
- `templates/config.yaml` file content edits — the template is already empty (`packages: []`, `tokens: []`); only docs referencing the schema change.
- `tsconfig.json` `paths` alias handling.
- Test-fixture corpus broader than the five buckets above.
- Token-value parsing or any FACT data beyond names.
- OSS_SPEC sweeps beyond §9.4 and §9.4.1 (Phase 8.1).

## Invariants

- The script operates entirely on CWD. Plugin install location is opaque to it.
- FACT.md output is byte-stable across machines, filesystems, and OSes for the same input — guaranteed by sorted source-walk file lists and config-ordered token harvesting.
- Canonical body stays project-agnostic: no KISA atom names, paths, or phrasing inside the extractor.

## Open items

- `package.json` does not yet exist at the repo root. If still absent at implementation time, the 4.1 commit authors a minimal first version sufficient for the `yaml` dependency and `node:test` invocation. The broader packaging surface remains Phase 7's responsibility.
- A top-level `scripts/` directory does not yet exist. The 4.1 commit creates it.
