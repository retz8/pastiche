# Task 2.4 — Author `templates/config.yaml`

Spec for TODO task 2.4: author the pastiche config template shipped to consumer projects. Inherits decisions from `docs/spec/phase-2-templates-and-skills.md`; this task overrides its §11 ("schema follows OSS_SPEC §9.4 unchanged") with substantive schema changes locked below.

## Scope

- Author `templates/config.yaml` (this repo) with the locked schema, defaults, banner, and field ordering.
- Rewrite OSS_SPEC §9.4 to reflect the new schema; rewrite OSS_SPEC §10 step 2 and any other path references to use `pastiche/config.yaml`.
- Add an OSS_SPEC §9.4.1 "Stack scenarios" subsection containing the four scenarios + full configs locked below.
- Amend TODO line 7.3 to note that `docs/config.md` hydrates from OSS_SPEC §9.4.1.
- Update the TODO 2.4 line to reference `templates/config.yaml` (not `templates/pastiche.config.yaml`).
- Agent/skill body path refs (currently reading `pastiche/pastiche.config.yaml`) are out of scope here — they are 2.8's job. The new path is flagged for the 2.8 sweep.
- Extractor path refs are out of scope (extractor is Phase 4.1, not yet ported).

## Locked decisions

### 1. Template consumption model

Static defaults; `init` copies the file verbatim, then mutates specific keys (`platform`, `packages`, `tokens`, `design_md_reference`, `typecheck_command`, `setup_progress`) based on prompts and detection. The template contains no templating syntax. "Defaults" are example/fallback values for manual-copy and testing scenarios; real adopters see init's mutated output.

### 2. Consumer path

`pastiche/config.yaml`, colocated with `FACT.md`, `KNOWLEDGE.md`, `WISDOM.md`. Replaces OSS_SPEC §9.4's root-level `pastiche.config.yaml`. Filename drops the redundant `pastiche.` prefix (folder already provides the namespace).

### 3. Template path in this repo

`templates/config.yaml`. Consistent with `templates/{FACT,KNOWLEDGE,WISDOM}.md` — no `pastiche/` prefix in the template filename.

### 4. Top-of-file banner

Three-line comment banner covering: ownership (adopter owns this file), sync semantics (`pastiche sync` honors edits), and pointer to deeper reference docs. No DO-NOT-EDIT language (this file is not auto-managed).

### 5. No inline per-field comments

`docs/config.md` (Phase 7.3) carries the per-field reference. The template ships with the banner only.

### 6. Field naming convention

snake_case for all field names. kebab-case scoped to `setup_progress` *values* (the section slugs), since those double as `/pastiche-setup --section <slug>` flag values.

### 7. Default values for prompt-driven fields

Empty/null sentinels — not realistic example values. Fields init prompts to fill ship as `null` or `[]`. Lint (Phase 4.2) fail-closes on still-empty required fields, making the "init must run before use" contract explicit.

### 8. `setup_progress` shipped fully seeded

All 13 keys present at `stub` in the template (the 12 KNOWLEDGE sections + `general-wisdom`). State is mechanical seeding, not adopter choice; `/pastiche-setup` flips keys to `done`.

### 9. Drop `fact_extractor` from v1

The plugin-extractor system (OSS_SPEC §14.1 / Phase 5.3) is undesigned and v1 ships only `ts-types`. A field with one legal value is theatrical. Re-introduced in v1.x when a second extractor exists.

### 10. Drop `pastiche_version` from v1

No v0 to migrate from, no v2 schema yet. Re-introduced when a real schema-version comparison is needed.

### 11. `platforms` → `platform` (singular, single-select)

Single string, not array. Legal values: `claude-code`, `codex`, `null` (pre-init). One adapter set generated per init. Adopters using both editors hand-edit or re-init (accepted trade-off vs. always-generating both sets).

### 12. Stack support scope (v1 MVP)

`packages` accepts two source modes: `types: <path>` (aggregate `.d.ts`) and `source_dir: <path>` (source-only / shadcn-style). `tokens` accepts two formats: `tailwind-v4-theme` and `css-vars`. Covers ≥70% of real-world React consumers per the research delegated during grilling.

Deferred to v1.x (with clear fail-closed errors from lint when adopter tries them): `types_glob` for per-file `.d.ts` libs; token formats `tailwind-v3-config`, `dtcg-json`, `js-export`, `classes`. The `classes`-as-tokens behavior is bundled implicitly into both v1 token formats (class selectors in the same CSS file are harvested alongside `--*` vars).

### 13. `packages` as list of objects

```yaml
packages:
  - name: "..."
    types: <path>          # one of: types | source_dir (exactly one)
    source_dir: <path>
    extensions: [...]      # source_dir only, optional
```

`name` is required and unique across entries (lint-enforced). Ordering preserved; first-listed wins on duplicate component exports. List form (vs map keyed by package name) accommodates `source_dir` mode where `name` is a human label, not an npm package specifier.

### 14. `tokens` as list of `{format, source}` entries

```yaml
tokens:
  - format: tailwind-v4-theme | css-vars
    source: <path>
    selectors: [...]       # css-vars only, optional
```

Composability — real consumers layer multiple token files (Tailwind theme + brand overrides + dark-mode stylesheet). Format is explicit per entry because `@theme {}` and `:root {}` need different parsers.

### 15. Per-entry optional sub-fields shipped in v1

`extensions` (on `source_dir` package entries; default `[".tsx", ".ts"]`) and `selectors` (on `css-vars` token entries; default `[":root"]`). Deferred to v1.x: `exclude` (per-package glob array) and `prefix` (per-token filter) — no scenario in the research needs them yet.

### 16. `design_md_reference` field semantics

Value is a path string (or `null`); not a boolean. Allows non-root locations (`docs/DESIGN.md`, `design/DESIGN.md`). `/pastiche-setup` writes the discovered path during opt-in.

Symmetric path safety checks at both read time (skill reading the config) and write time (setup writing the path): resolve to absolute, verify file exists and is readable, verify path is inside the consumer repo (reject `..` traversal). On read-time failure, warn and proceed as if `null` (no crash). On write-time failure, reject the opt-in.

### 17. `typecheck_command` field

Default in template: `null`. Per phase spec decision 8, `null` means implementer agents skip the typecheck step.

Init-time behavior (Phase 5.4 scope, captured here for downstream): init auto-detects from `package.json` (`scripts.typecheck` / `scripts.type-check` / `scripts.tsc`) and prompts confirmation. Detects the consumer's package manager from the lockfile (`pnpm-lock.yaml` / `yarn.lock` / `bun.lock` / default npm) and writes the correctly-prefixed invocation (`pnpm typecheck`, `npm run typecheck`, etc.). Manual prompt fallback when no script is found.

### 18. `setup_progress` keys: kebab-case

13 keys, all kebab-case slugs that double as `/pastiche-setup --section <slug>` flag values. One slug form across YAML and CLI; no translation layer.

Keys (in order):
`action-buttons`, `forms-input-collection`, `feedback-status`, `overlays`, `navigation-wayfinding`, `content-display`, `layout-page-structure`, `date-time-selection`, `iconography`, `visual-hierarchy`, `domain-specific-patterns`, `brand-identity`, `general-wisdom`.

### 19. `pastiche/` folder hardcoded

Not configurable. CLI, agents, and skills all assume `pastiche/{FACT,KNOWLEDGE,WISDOM,config}.{md,yaml}` literally. If a real adopter ever needs a different location, a `pastiche_dir` field is a non-breaking addition.

### 20. Top-level field ordering (edit-flow)

```
platform
packages
tokens
design_md_reference
typecheck_command
setup_progress
```

Init-filled fields first; skill-mutated state last. Signals "machine-managed, don't hand-edit" by position.

### 21. Four stack scenarios (capture mandate)

The following four scenarios + full configs are part of the locked output of this grill, to be embedded verbatim in OSS_SPEC §9.4.1 and referenced by the task's release-doc descendants (`docs/config.md`).

**Scenario 1 — KISA-style monorepo (`types` + `tailwind-v4-theme`)**

```yaml
platform: claude-code
packages:
  - name: "@umichkisa-ds/web"
    types: packages/web/dist/index.d.ts
  - name: "@umichkisa-ds/form"
    types: packages/form/dist/index.d.ts
tokens:
  - format: tailwind-v4-theme
    source: src/styles/theme.css
```

**Scenario 2 — npm aggregate `.d.ts` + CSS vars (MUI / Primer shape)**

```yaml
platform: claude-code
packages:
  - name: "@primer/react"
    types: node_modules/@primer/react/dist/index.d.ts
tokens:
  - format: css-vars
    source: node_modules/@primer/primitives/dist/css/colors/light.css
  - format: css-vars
    source: node_modules/@primer/primitives/dist/css/base/size.css
```

**Scenario 3 — Shadcn (canonical 2026 setup)**

```yaml
platform: claude-code
packages:
  - name: ui
    source_dir: src/components/ui
tokens:
  - format: tailwind-v4-theme
    source: src/app/globals.css
```

**Scenario 4 — Shadcn + custom CSS vars**

```yaml
platform: claude-code
packages:
  - name: ui
    source_dir: src/components/ui
  - name: brand
    source_dir: src/components/brand
tokens:
  - format: tailwind-v4-theme
    source: src/app/globals.css
  - format: css-vars
    source: src/styles/brand-tokens.css
```

### 22. OSS_SPEC + TODO edit list

Performed in the same commit as the template author:

- OSS_SPEC §9.4 — rewritten to reflect locked schema (drop `pastiche_version` / `fact_extractor`, switch to `platform` singular, `packages` list, `tokens` list with `format`, snake_case fields, kebab-case `setup_progress` values).
- OSS_SPEC §9.4.1 — new subsection containing the four scenarios verbatim (decision 21).
- OSS_SPEC §10 step 2 — path change to `pastiche/config.yaml`.
- OSS_SPEC §9.4 closing paragraph and any other §-references — path updated.
- TODO line 2.4 — filename updated to `templates/config.yaml`.
- TODO line 7.3 — amended to note `docs/config.md` hydrates from OSS_SPEC §9.4.1.

## Invariants

- Phase 2 spec §11 ("schema follows OSS_SPEC §9.4 unchanged") is explicitly overridden by this task.
- Every other phase spec decision remains in force.
- Agent/skill body path refs to `pastiche/pastiche.config.yaml` are out of scope here; flagged for the Phase 2.8 sweep.
- Phase 4.1 extractor enhancement (source-directory walking, plain-CSS-vars parser) is required for v1 stack-scope decision 12 to be functional; not implemented in this task.
- Phase 4.2 lint must enforce: required-field non-emptiness post-init, exactly-one of `types`/`source_dir` per package entry, package `name` uniqueness, `platform` ∈ {`claude-code`, `codex`}, `tokens[].format` ∈ {`tailwind-v4-theme`, `css-vars`}, all 13 `setup_progress` keys present. Lint implementation is not in this task.

## Open items

None flagged during grilling. The release-doc field-reference path (`docs/config.md`) is referenced by the banner but its final path is acceptable to confirm later; not a blocker for this task.
