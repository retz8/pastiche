# Task 4.2 — Lint script (`scripts/lint.ts`)

Spec for porting `_dev/scripts/lint-tags.ts` (+ test) to top-level `scripts/lint.ts` under the plugin-first pivot, generalized off KISA and expanded to the v1 single fail-closed checkpoint. Parent: Phase 4 of `_dev/docs/TODO.md`; phase spec at `docs/spec/phase-4-scripts.md`.

## Scope

- Promote `_dev/scripts/lint-tags.ts` → `scripts/lint.ts`. Library + guarded `main()` shape (Phase 4 decision 5).
- Promote `_dev/scripts/lint-tags.test.ts` → `scripts/lint.test.ts`. Test fixtures rewritten to the new FACT and WISDOM formats; new buckets added per the expanded scope below.
- Author `scripts/canonical-sections.ts` shared module owning the 12 canonical KNOWLEDGE H2 names and their kebab-case slugs.
- Delete `_dev/scripts/lint-tags.ts` and `_dev/scripts/lint-tags.test.ts` in the same commit (Phase 4 decision 7).

Lint is the v1 fail-closed checkpoint covering five check families:

1. Sentinels — required files exist; required config fields non-null; at least one of `packages`/`tokens` non-empty; FACT has atoms.
2. Config schema — non-null fields match their declared shapes.
3. FACT schema — structural anchors match the implementer agents' grep contract.
4. WISDOM tag check — bracket groups well-formed; tags resolve to FACT atoms or `[GENERAL]`.
5. KNOWLEDGE refs + canonical sections — backticked spans resolve; all 12 canonical H2s present.

## Locked decisions

### 1. KNOWLEDGE token detection: FACT-membership only

The `_dev/` `TOKEN_SHAPE` regex (which gated tokens by `--*` / `.type-*` / `.ds-*` shapes) is dropped entirely. Any backticked code-span in KNOWLEDGE is checked as follows: if its first PascalCase head matches a FACT component → component check; else if the span verbatim ∈ FACT tokens → fine; else → ignored (Tailwind utility / prop / prose). v1 tolerates that misspelled tokens slip past lint as "ignored prose" — agents will fail downstream when they grep FACT.

### 2. Invocation model: zero-arg, CWD-rooted

The script takes no CLI arguments. It reads `./pastiche/{FACT,KNOWLEDGE,WISDOM}.md` and `./pastiche/config.yaml` from the current working directory. The script never inspects its own install location; the plugin path is opaque to it. The `/pastiche-lint` skill body is responsible for being in the adopter's repo before invoking the script. Mirrors task 4.1 decision 7.

### 3. Sentinel layer for missing/empty docs

Before any schema or cross-doc check runs, lint surfaces clean sentinel errors with init/sync pointers for fundamental "not ready yet" states. Sentinel-required fields: `platform` non-null, `typecheck_command` non-null, at least one of `packages` or `tokens` non-empty, FACT contains at least one atom. Missing files (`pastiche/FACT.md`, `pastiche/KNOWLEDGE.md`, `pastiche/WISDOM.md`, `pastiche/config.yaml`) surface as sentinel errors with the same pattern. Each sentinel produces a single actionable message ("FACT.md not found — run /pastiche-init first"; "FACT.md has no atoms — run /pastiche-sync"; etc.).

### 4. Lint scope: wide

Lint covers cross-doc tag sanity + KNOWLEDGE canonical sections + config.yaml schema + FACT schema. This honors task 4.1 decision 13 ("Schema validation is lint's responsibility"). It is the single fail-closed checkpoint adopters hit for the entire pastiche surface.

### 5. FACT parsing: grep-style, agent-contract aligned

Lint reads FACT via line-by-line grep-style matching, not YAML parsing. Atom names are lines at column 0 matching `^[A-Za-z][\w.]*:` inside the `## Components` fenced block; tokens are non-empty, non-comment lines under the `## Tokens` H2. This matches the implementer agents' `grep -nE '^Atom:'` contract from task 4.1 decision 14. If lint passes, every agent grep works.

### 6. WISDOM tag parser

**6a — Strict, no internal whitespace.** Bracket groups must be `[A,B,C]` with no whitespace around commas. Required because the implementer round1 grep at `agents/pastiche-implementer-round1.md:29` is whitespace-strict — `[A, B]` would lint clean under leniency but be invisible to the agent at task time.

**6b — Strict reject of legacy `[A][B]` concatenated syntax.** Detect concatenated `][` runs and fail. No autofix suggestion in the error message; pastiche has no installed base at v1 release, so no legacy adopters need a migration hint.

**6c — Malformed bracket groups rejected.** Empty `[]`, leading `[,A]` / trailing `[A,]` / double `[A,,B]` commas, and whitespace-only `[ ]` all surface under a single "malformed tag group" error class.

### 7. Config.yaml schema validation

**7a — Tiered: sentinel vs schema.** Null required fields produce sentinel errors ("platform not set — run /pastiche-init"); malformed non-null fields produce typed schema errors ("platform must be one of: claude-code, codex"). Both fail lint with distinct error classes for UX.

**7b — Sentinel-required vs tolerate-empty.** Sentinel-required: `platform` non-null, `typecheck_command` non-null, at least one of `packages`/`tokens` non-empty (both empty is the root cause of empty FACT, caught upstream rather than as the downstream FACT sentinel). Tolerate empty/null: `design_md_reference`, `packages: []` alone (tokens-only project), `tokens: []` alone (component-only DS without custom CSS tokens).

**7c — Concrete schema rules.** Validate (when non-null): `platform` ∈ {`claude-code`, `codex`}; `packages[]` each have non-empty `name`, names unique, exactly one of `types` or `source_dir`, all path strings non-empty; `tokens[]` each a non-empty string; `design_md_reference` string or null; `typecheck_command` non-empty string; `setup_progress` keys are exactly the 13 fixed keys (12 KNOWLEDGE section slugs + `general-wisdom`), values from a fixed enum sourced from the 2.4 config spec.

### 8. FACT schema validation rules

Validate: `## Components` H2 present at column 0; fenced ```yaml block present immediately under it; every column-0 line inside the components block matches `^[A-Za-z][\w.]*:` (lenient — no case requirement, accepts `Form.Input`, `MDX_Heading`, etc.); `## Tokens` H2 present at column 0; every non-empty, non-comment line under `## Tokens` has no bullet prefix and no leading whitespace; no duplicate atom names; no duplicate token names. Banner check is **not** performed (cosmetic, not part of any contract). Per-atom prop completeness is **not** validated (extractor's responsibility, per task 4.1 decision 13).

### 9. Canonical section list: shared module

Author `scripts/canonical-sections.ts` exporting an ordered `CANONICAL_SECTIONS` array of `{ name, slug }` pairs (12 entries — the canonical KNOWLEDGE H2s only) plus `nameToSlug` / `slugToName` helpers. Lint imports it for the section-presence check. The 13th `setup_progress` key `general-wisdom` is config-side-only and is not part of this module; it lives in the config schema rules. Future template/config generation can import the same module to eliminate drift; v1 hand-authored templates are not retrofitted in this task.

### 10. Check orchestration: hybrid short-circuit

Sentinels, config schema, and FACT schema all run unconditionally and report together in one pass. The WISDOM tag check and the KNOWLEDGE refs + canonical sections check short-circuit only when FACT schema failed — because their atom set would be garbage and produce cascading false-positive "unknown atom" violations. Config-schema and FACT-schema failures do not suppress one another; only the FACT→WISDOM/KNOWLEDGE dependency triggers suppression.

## Invariants

- The script is project-agnostic. No KISA atom names, paths, token-shape conventions, or phrasing remain in the ported file.
- The script operates entirely on `process.cwd()`. Plugin install location is opaque to it.
- The script's view of FACT is identical to the implementer agents' grep contract. Drift between lint and agents on what counts as an atom is a bug.
- Library exports power the test suite; `main()` preserved for direct dev execution (Phase 4 decision 5).

## Open items

None flagged during grilling.
