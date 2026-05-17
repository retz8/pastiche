# Pastiche OSS — v1 Delivery Spec

_Captures the design decisions resolved through grilling on 2026-05-16 for extracting and generalizing pastiche from the umichkisa-ds testbed into a standalone open-source project._

This document is the **delivery spec** for the OSS extract. It is paired with — but distinct from — the existing `pastiche/spec.md`, which is the **philosophical spec** describing what pastiche *is* (motivation, three-document architecture, implementer/reviewer asymmetry, speculative doubt, loop economics). Where this doc and the philosophical spec overlap, the philosophical spec is authoritative; this doc focuses on shipping.

---

## 1. Context & Goals

### 1.1 What is being extracted

The umichkisa-ds repository contains a working pastiche installation under `pastiche/`:

- A skill (`.claude/skills/pastiche/SKILL.md`) that orchestrates a three-agent doubt-defense loop.
- Three subagent definitions (`.claude/agents/pastiche-implementer-round1.md`, `pastiche-implementer-round2.md`, `pastiche-reviewer.md`).
- Three documents (`FACT.md`, `KNOWLEDGE.md`, `WISDOM.md`) — partly project-specific content, partly templated shape.
- A FACT extractor script and a tag-sanity lint script.
- The philosophical spec (`spec.md`), the high-level implementation plan (`high-level-plan.md`), iteration notes, and the original Button vertical-slice experiment.

This OSS extract takes the **project-agnostic** core of that installation — skill, agents, templates, lint, extractor contract, and surrounding adoption tooling — and ships it as a standalone repository named **`pastiche`**. KISA-specific content (the populated FACT/KNOWLEDGE/WISDOM, KISA paths, KISA atoms) stays inside umichkisa-ds.

### 1.2 Why now

The philosophical spec is stable and validated against a live client migration. The project-agnostic invariant (KISA is the testbed, not the audience; agent prompts must not embed KISA atoms or paths) is already enforced internally. The remaining work to make pastiche adoptable by other teams is mechanical: package it, document it, give it an install path.

### 1.3 What "v1" means

The minimum surface that lets a third-party design-system team:

1. Install pastiche into their repository.
2. Generate a FACT.md from their codebase.
3. Walk through an interactive setup that fills KNOWLEDGE.md and seeds `[GENERAL]` WISDOM.
4. Invoke the gating loop on a frontend task.
5. Extend KNOWLEDGE.md and WISDOM.md over time through dedicated authoring skills.
6. Run the cross-doc lint in CI.

Anything beyond that — additional platform adapters, mechanical DESIGN.md import as a standalone verb, aesthetic review skill, atom-tagged WISDOM seeding tooling, multi-package extractor variants — is deferred (§13).

---

## 2. v1 Scope

### 2.1 What ships

| Surface | v1 contents |
|---|---|
| CLI | `pastiche init`, `pastiche sync`, `pastiche lint` |
| User-facing skills | `pastiche`, `pastiche-setup`, `pastiche-write-knowledge`, `pastiche-write-wisdom` |
| Internal agents | `pastiche-implementer-round1`, `pastiche-implementer-round2`, `pastiche-reviewer` |
| Templates | `FACT.md`, `KNOWLEDGE.md`, `WISDOM.md`, `config.yaml` |
| Platform adapters | Claude Code (validated end-to-end), Codex CLI (placeholder — files shipped, runtime unverified by author; community validation invited) |
| Reference adoption | `examples/primer-react/` — small Next.js + `@primer/react` app with populated docs |
| External adopter | KISA design system (linked from README; not in-tree) |

### 2.2 What does not ship in v1

See §13 for full list. Highlights:

- Gemini CLI / Cursor / Aider / other-platform adapters.
- **End-to-end validation of the Codex CLI adapter.** Codex sidecars and adapter template ship in v1, but the author lacks Codex CLI access; runtime correctness is unverified. The §15 acceptance checklist runs against Claude Code only. Codex validation is a v1.x community follow-up.
- A `pastiche import --from design-md` standalone CLI verb (DESIGN.md handling lives inside the setup skill in v1; see §11).
- Atom-tagged WISDOM seeding tooling.
- Aesthetic review skill (philosophical spec §15).
- Multi-language FACT extractors (v1 ships TypeScript-types extractor only; the contract is documented so others can swap).

---

## 3. Supported Platforms

### 3.1 v1: Claude Code + Codex CLI

Both platforms expose three primitives pastiche needs:

| Primitive | Claude Code | Codex CLI |
|---|---|---|
| Subagent dispatch with isolated context | `Task` tool + `.claude/agents/*.md` (YAML frontmatter + markdown) | Natural-language spawn + `.codex/agents/*.toml` |
| Orchestrator skill / instructions | `Skill` tool + `.claude/skills/*/SKILL.md` | Skills (repeatable processes) + `AGENTS.md` for project-wide instructions |
| Read/Write/Edit/Bash tooling | Native | Native |

The three-agent loop runs on both platforms without architectural redesign. Pastiche's canonical prompts (§4) compile into each platform's required envelope.

### 3.2 Deferred platforms

Documented as a future contribution surface, not part of v1:

- **Gemini CLI** — has `.gemini/agents/*.md` (YAML frontmatter + markdown, near-identical to Claude Code shape) and subagent dispatch. Adapter is small but unbuilt in v1.
- **Cursor** — no subagent primitive. Adapter would be a degraded `.cursor/rules/*.mdc` single-context rule file. v1 does not ship degraded modes.
- **Aider** — no subagent primitive. Same as Cursor.
- **Other shells mentioned during grill** (hermes, ohmyopencode, etc.) — deferred until v1 ships.

Adding a new platform post-v1 means: (a) write an adapter template (§4.3); (b) update the CLI's platform detection in `init`/`sync`; (c) document at `docs/adapters/<platform>.md`. No core changes.

---

## 4. Adapter Architecture (Canonical Source + Build)

### 4.1 The model

**Shape 1 — canonical source + build step.** A single set of canonical prompts lives in the OSS repo. Per-platform output files are generated by `pastiche init` (first install) and `pastiche sync` (after upgrade). Pre-built per-platform files are **not** committed.

This was the decision over Shape 2 (commit pre-built per-platform files and copy them at install). Reasons:

1. Agent prompts will iterate; keeping 3+ duplicates per agent in sync manually is a bug factory.
2. Frontmatter/TOML wrappers are ~5 lines; templating them at install is cheap.
3. `pastiche sync` becomes meaningful — re-resolves canonical → platform after an upgrade.
4. Mirrors the shadcn/ui registry-resolves-at-install model that adopters already understand.

### 4.2 Canonical sources

```
agents/
  pastiche-implementer-round1.md                       # pure markdown prompt body, no frontmatter
  pastiche-implementer-round1.claude-code.meta.yaml    # Claude Code envelope: name, description, model, tools
  pastiche-implementer-round1.codex.meta.yaml          # Codex envelope: name, description, model, sandbox_mode
  pastiche-implementer-round2.md
  pastiche-implementer-round2.claude-code.meta.yaml
  pastiche-implementer-round2.codex.meta.yaml
  pastiche-reviewer.md
  pastiche-reviewer.claude-code.meta.yaml
  pastiche-reviewer.codex.meta.yaml
skills/
  pastiche.md       # the gating-loop orchestrator instructions
  pastiche-setup.md
  pastiche-write-knowledge.md
  pastiche-write-wisdom.md
```

Each canonical body is platform-agnostic markdown: a system-prompt body for agents, an orchestrator-instruction body for skills. No frontmatter. Tool references inside agent bodies use whatever the consumer's runtime exposes (both Claude Code and Codex expose Read/Write/Edit/Bash/Glob primitives).

Per-platform sidecars carry envelope inputs that *are* platform-specific (model name, tool allowlist, sandbox mode). The adapter layer does no translation — it reads the platform's own sidecar and wraps the canonical body in the platform's required format. Adding a new platform = add a new sidecar per agent + a new adapter template. No central mapping table.

### 4.3 Adapter templates

```
adapters/
  claude-code/
    agents.template     # YAML frontmatter wrapper for agent bodies
    skills.template     # SKILL.md wrapper for skill bodies
  codex/
    agents.template     # TOML wrapper for agent bodies
    skills.template     # Codex skill or AGENTS.md fragment wrapper
```

Each template declares the platform-specific envelope (frontmatter keys, file format, output path) and references the canonical body by name. The CLI resolves a template + canonical body → emit final file.

### 4.4 Output locations in the adopter's repo

**Claude Code:**
```
.claude/
  skills/
    pastiche/SKILL.md
    pastiche-setup/SKILL.md
    pastiche-write-knowledge/SKILL.md
    pastiche-write-wisdom/SKILL.md
  agents/
    pastiche-implementer-round1.md
    pastiche-implementer-round2.md
    pastiche-reviewer.md
```

**Codex CLI:**
```
.codex/agents/
  pastiche-implementer-round1.toml
  pastiche-implementer-round2.toml
  pastiche-reviewer.toml
.agents/skills/
  pastiche/SKILL.md
  pastiche-setup/SKILL.md
  pastiche-write-knowledge/SKILL.md
  pastiche-write-wisdom/SKILL.md
```

Note the path asymmetry: Codex skills live under `.agents/skills/` (cross-tool convention), while subagents live under `.codex/agents/`. See `docs/adapters/codex.md` for the full Codex adapter contract.

The adopter selects a single target platform at `init` (`platform` field in `pastiche/config.yaml`; §9.4); switching platforms means re-running `init`. v1 generates one adapter tree per install.

### 4.5 Adapter regeneration discipline

`pastiche sync` regenerates adapter outputs idempotently. **It does not preserve adopter edits to generated files** — generated files are owned by pastiche. Adopters who want to override behavior do so by editing canonical sources in their own fork, not by editing generated outputs. This is documented in the README and surfaced in a generated-file banner comment at the top of every adapter output.

---

## 5. Repo Structure

The OSS repo post-extraction:

```
pastiche/
├── .claude-plugin/
│   ├── plugin.json           # for installation via Claude Code plugin mechanism
│   └── marketplace.json      # if listed in a marketplace
├── agents/                   # canonical agent prompts (markdown body + per-platform sidecars)
│   ├── pastiche-implementer-round1.md
│   ├── pastiche-implementer-round1.claude-code.meta.yaml
│   ├── pastiche-implementer-round1.codex.meta.yaml
│   ├── pastiche-implementer-round2.md
│   ├── pastiche-implementer-round2.claude-code.meta.yaml
│   ├── pastiche-implementer-round2.codex.meta.yaml
│   ├── pastiche-reviewer.md
│   ├── pastiche-reviewer.claude-code.meta.yaml
│   └── pastiche-reviewer.codex.meta.yaml
├── skills/                   # canonical skill orchestrator bodies
│   ├── pastiche.md
│   ├── pastiche-setup.md
│   ├── pastiche-write-knowledge.md
│   └── pastiche-write-wisdom.md
├── adapters/                 # per-platform envelope templates
│   ├── claude-code/
│   └── codex/
├── templates/                # project-side scaffolds installed by `pastiche init`
│   ├── FACT.md
│   ├── KNOWLEDGE.md
│   ├── WISDOM.md
│   └── config.yaml
├── cli/                      # CLI implementation
│   └── src/
│       └── (init / sync / lint / extract-fact / generate-adapters)
├── scripts/                  # standalone scripts
│   ├── extract-fact-ts.ts    # reference TypeScript-types extractor
│   └── lint.ts               # tag-sanity lint
├── examples/
│   └── primer-react/         # in-tree reference adoption (§12)
│       ├── (Next.js + @primer/react demo app)
│       └── pastiche/
│           ├── FACT.md       # extracted
│           ├── KNOWLEDGE.md  # hand-curated illustrative
│           └── WISDOM.md     # hand-curated illustrative
├── docs/
│   └── OSS_SPEC.md           # this document
├── spec.md                   # ported from umichkisa-ds/pastiche/spec.md
├── README.md
├── LICENSE
└── package.json
```

The `pastiche/oss/docs/` folder in umichkisa-ds (where this file currently lives) is the **staging area** for OSS docs during the extract. Post-extract, its contents move to the OSS repo's `docs/`.

---

## 6. CLI Surface

Three verbs. Each is idempotent.

### 6.1 `pastiche init`

**Purpose:** First-time installation in an adopter's repository.

**Behavior:**

1. Prompt for the target platform (Claude Code or Codex). Default: detect existing `.claude/` or `.codex/` directory; offer to install for what's present. Single-select; switching platforms means re-running `init`.
2. Scaffold `pastiche/` folder at repo root with empty `FACT.md`, `KNOWLEDGE.md` (with the canonical 12 H2 stubs from philosophical spec §3.2), and `WISDOM.md` (with header + tag-format reminder + commented-out `[GENERAL]` suggestions).
3. Scaffold `pastiche/config.yaml` (colocated with the three docs) with empty/null sentinels (§9.4); auto-detect `typecheck_command` from `package.json` scripts and prompt to confirm; auto-detect package manager from lockfile for the invocation prefix.
4. Run the FACT extractor against the adopter's codebase. If it can't locate the DS module, prompt for path, write to config, retry.
5. Generate adapter files (§4.4) for the selected platforms.
6. Print next-step guidance: run `/pastiche-setup` to start the interactive KNOWLEDGE bootstrap.

**Critical:** `init` does **not** detect or touch `DESIGN.md`. That logic lives in the setup skill (§7.2, §11).

**Flags:** `--platform claude-code|codex`, `--ds-path <path>`, `--dry-run`.

### 6.2 `pastiche sync`

**Purpose:** Re-resolve everything from the canonical sources and the adopter's current state.

**Behavior:**

1. Re-run the FACT extractor (picks up codebase changes since last run).
2. Regenerate adapter files from canonical sources (picks up pastiche-version upgrades).
3. Respects user edits to `pastiche/config.yaml` — if the adopter changed `packages` or `tokens` entries, or switched `platform`, sync acts on the new config.

**Adopter expectation:** Run `sync` after upgrading the pastiche package, after a significant DS code change, or after editing `pastiche/config.yaml`. Safe to run on every commit; idempotent if nothing changed.

**Flags:** `--dry-run`, `--platform <name>` (override config).

### 6.3 `pastiche lint`

**Purpose:** Cross-doc tag-sanity check, per philosophical spec §14.2.

**Behavior:**

1. Parse FACT.md → canonical atom names.
2. Parse WISDOM.md → every `[atom]` tag must resolve to a FACT atom verbatim; `[GENERAL]` is the lone allowed non-FACT tag.
3. Parse KNOWLEDGE.md → every atom reference (right-hand side of `→` lines, code-spans naming atoms) must resolve to FACT.
4. Verify KNOWLEDGE.md declares every canonical section from philosophical spec §3.2 as an H2.
5. Fail closed on any unresolved reference or missing section. Clear error messages naming document, line number, atom.

**Adopter expectation:** Wire into CI. Runs in seconds. Not optional.

---

## 7. Skills Surface

Four user-facing skills. Three execute work; one orchestrates subagents.

### 7.1 `pastiche` (the gating loop)

**Trigger:** A frontend task in any project with `pastiche/{FACT,KNOWLEDGE,WISDOM}.md` set up.

**Behavior:** Orchestrates the three-agent doubt-defense loop (philosophical spec §5–§8). Dispatches subagents; does not run inference itself.

1. Preflight: verify `pastiche/{FACT,KNOWLEDGE,WISDOM}.md` exist.
2. Dispatch `pastiche-implementer-round1` → capture `{r1_report}`.
3. Dispatch `pastiche-reviewer` → capture `{doubts}` (strict YAML).
4. If `{doubts}` is `[]`, emit final report. Otherwise dispatch `pastiche-implementer-round2` with `{doubts}` and `{r1_report}`.
5. Failsafe: write `// pastiche-unresolved-doubt:` comments for any doubt `pastiche-implementer-round2` omitted from its disposition list.
6. Emit Summary + Follow-ups (philosophical spec §7.5.1).

**Implementation note:** The skill body is the canonical `skills/pastiche.md`. Adapter generation wraps it for Claude Code (`SKILL.md` with frontmatter) and Codex (skill format / AGENTS.md fragment).

### 7.2 `pastiche-setup`

**Trigger:** First-time adoption, post-`pastiche init`. Invoked manually by the adopter.

**Mode:** **In-session, no subagent dispatch.** The skill runs as conversational instructions inside the current agent. Subagent dispatch here would be overhead — setup is interactive grilling, not heavy code generation.

**Behavior:**

1. Read `pastiche/config.yaml`.
2. **DESIGN.md detection** — if `design_md_reference` is unset in config, scan repo root for a `DESIGN.md` file. If found, ask the adopter to opt in: *"DESIGN.md detected. Use it as a reference for the setup grill? (Tokens / brand prose / patterns will be cross-referenced.)"*
   - If yes: write `design_md_reference: ./DESIGN.md` to config. **Auto-copy DESIGN.md's brand-identity prose section** into KNOWLEDGE.md's Brand Identity stub. This is the one mechanical port from DESIGN.md; it touches no other section.
   - If no: skip.
3. Read FACT.md as the ground-truth atom catalog. Prompt invariant: *never mention atoms outside of FACT*.
4. Walk the canonical 12 KNOWLEDGE sections from philosophical spec §3.2 progressively (`--section <name>` for one section; `--all` for all twelve). Default: ask the adopter which section to start with.
   For each section:
   - If `design_md_reference` is set: pull relevant DESIGN.md excerpts as grill ammunition. Ask scenario-by-scenario questions cross-referenced against DESIGN.md content.
   - If not: pose canonical scenarios for the section (e.g., for *Action buttons*: primary CTA, destructive, secondary, loading state, icon-only) and ask which atoms from FACT map to each.
   - Draft KNOWLEDGE entries from answers. Read each draft back for confirmation.
   - Update `setup_progress.<section>` in config from `stub` → `filled`.
5. Ask 3–5 `[GENERAL]` WISDOM questions covering near-universal posture rules:
   - "Should pastiche enforce 'never raw hex; always tokens' for this DS?"
   - "Stick to the documented spacing scale (no arbitrary spacing)?"
   - "Respect documented breakpoints (no arbitrary media queries)?"
   - "Accessibility floors — any DS-wide invariants?"
   - "Landmark requirements — any DS-wide rules?"
   For each "yes," draft a `[GENERAL]` WISDOM entry. Update `setup_progress.general-wisdom: filled`.
6. **Stop.** Atom-tagged WISDOM is not seeded by setup — it grows via the living-document loop (philosophical spec §10), serviced by `pastiche-write-wisdom` (§7.4).

**Flags:** `--section <name>`, `--all`, `--resume` (resume the last incomplete section).

### 7.3 `pastiche-write-knowledge`

**Trigger:** Two surfaces:
- **Free-form** — adopter wants to add or revise a KNOWLEDGE mapping from a discussion, sketch, or new requirement.
- **Structured** — a `knowledge-gap` Follow-up emitted by the `pastiche` skill's gating loop.

**Mode:** **In-session, no subagent dispatch.** Conversational authoring.

**Behavior:**

1. Read FACT.md and KNOWLEDGE.md.
2. If invoked with a knowledge-gap Follow-up: load the gap context (file, line, scenario description).
3. Identify which canonical section the new entry belongs to.
4. Draft a scenario → atom(s) mapping, prompting the adopter for scenario phrasing, the atom selection from FACT, and any prose context.
5. Re-read the draft. On confirmation, insert into the appropriate KNOWLEDGE.md section.
6. Run `pastiche lint` to verify the new entry resolves cleanly.

### 7.4 `pastiche-write-wisdom`

**Trigger:** Two surfaces:
- **Free-form** — adopter wants to add or revise a WISDOM rule.
- **Structured** — a `wisdom-gap` Follow-up emitted by the `pastiche` skill's gating loop.

**Mode:** **In-session, no subagent dispatch.**

**Behavior:**

1. Read FACT.md and WISDOM.md.
2. Verify the proposed rule is **atom-intrinsic** (per philosophical spec §3.3). If the rule is scenario-conditional, redirect: *"This sounds scenario-conditional ('destructive actions must…'). Should it be a KNOWLEDGE mapping instead?"* — re-route to `pastiche-write-knowledge`.
3. If atom-intrinsic: ask which atom(s) it tags. Verify the tag spelling against FACT.
4. If the rule has no specific atom and applies system-wide: confirm `[GENERAL]` is appropriate (per philosophical spec §4) — high bar.
5. Draft the entry. Read back. On confirmation, insert into WISDOM.md.
6. Run `pastiche lint`.

---

## 8. Internal Agents

Three subagents, dispatched only by the `pastiche` skill. Not user-invocable directly.

### 8.1 `pastiche-implementer-round1`

- **Persona:** Senior frontend engineer working inside the design system. Faithful executor.
- **Context:** KNOWLEDGE.md (lazy by canonical section, plus always-load Brand Identity) + WISDOM.md (`[GENERAL]` always; remaining lazy by atom tag) + FACT.md (grep-only, after KNOWLEDGE has selected atoms).
- **Output:** `pastiche-implementer-round1` report (philosophical spec §7.5.1) — files changed, brief summary, optional `knowledge-gap` notes.

### 8.2 `pastiche-implementer-round2`

- **Persona:** Same as `pastiche-implementer-round1`, tilted toward correction over defense.
- **Context:** `pastiche-implementer-round1`'s full report + `pastiche-reviewer`'s doubt list. Re-greps WISDOM/FACT only for atoms newly introduced by corrections.
- **Output:** Per-doubt disposition (`corrected` / `defended` with optional gap-tag) + round-2 report.

### 8.3 `pastiche-reviewer`

- **Persona:** Senior UI/UX designer fluent in the project's DS. Tilts toward over-doubting. Task-anchored.
- **Context:** FACT.md (full) + WISDOM.md (`[GENERAL]` always; remaining lazy by atom tag) + task description. **Does not read KNOWLEDGE.md** (philosophical spec §5.3).
- **Tools:** Read, Bash, Glob (read-only).
- **Output:** 5-section report with strict YAML `## Doubts` block.

---

## 9. Templates Shipped by `init`

### 9.1 `FACT.md`

Header + extractor banner. The extractor populates entries on `init`/`sync`. Adopter does not hand-edit.

### 9.2 `KNOWLEDGE.md`

```markdown
# KNOWLEDGE

## Action buttons

_(empty — fill via `/pastiche-setup --section action-buttons`)_

## Forms & input collection

_(empty)_

... (remaining 10 sections as empty H2 stubs, ending with `## Brand Identity`) ...

## Brand Identity

_(prose — fill via `/pastiche-setup` or auto-copied from DESIGN.md if opted in)_
```

The canonical 12 H2 sections are mandatory. The lint enforces presence; stubs are allowed.

### 9.3 `WISDOM.md`

```markdown
# WISDOM

> Each entry is tagged with the atom names it pertains to. Tags must match FACT.md verbatim.
> `[GENERAL]` is the lone allowed non-FACT tag (system-wide invariants).
> See `docs/wisdom.md` for the tag discipline.

<!-- Optional [GENERAL] rules — uncomment what applies, or use /pastiche-setup to be walked through them:
- [GENERAL] Use design tokens for all colors; never raw hex.
- [GENERAL] Stick to the documented spacing scale; no arbitrary spacing values.
- [GENERAL] Respect documented breakpoints; no arbitrary media queries.
- [GENERAL] All interactive elements meet WCAG AA contrast.
- [GENERAL] Every page declares semantic landmarks.
-->
```

Atom-tagged entries are not seeded. WISDOM grows over time via `pastiche-write-wisdom`.

### 9.4 `pastiche/config.yaml`

Colocated with the three docs under `pastiche/`. Adopter-owned; `pastiche sync` honors edits. The template ships as empty/null sentinels — `pastiche init` populates required fields via prompts and detection.

```yaml
platform: null
packages: []
tokens: []
design_md_reference: null
typecheck_command: null
setup_progress:
  action-buttons: stub
  forms-input-collection: stub
  feedback-status: stub
  overlays: stub
  navigation-wayfinding: stub
  content-display: stub
  layout-page-structure: stub
  date-time-selection: stub
  iconography: stub
  visual-hierarchy: stub
  domain-specific-patterns: stub
  brand-identity: stub
  general-wisdom: stub
```

Field semantics:

- **`platform`** — single string (`claude-code` or `codex`). v1 generates one adapter tree per `init`; switching platforms means re-running `init`.
- **`packages`** — list of `{name, types | source_dir, ...}` entries. `name` is required and unique. Exactly one of `types` (aggregate `.d.ts`) or `source_dir` (source-walk) per entry. Optional `extensions` (on `source_dir`; default `[".tsx", ".ts"]`). See §9.4.1 for shapes.
- **`tokens`** — list of `{format, source, ...}` entries. `format` ∈ {`tailwind-v4-theme`, `css-vars`}. Optional `selectors` (on `css-vars`; default `[":root"]`). See §9.4.1 for shapes.
- **`design_md_reference`** — path string (or `null`); not a boolean. Allows non-root locations. `/pastiche-setup` writes the discovered path during opt-in. Path-safety checks (resolve, in-repo, readable) apply at both read and write time.
- **`typecheck_command`** — full shell command (e.g. `"pnpm typecheck"`). `null` means implementer agents skip the typecheck step.
- **`setup_progress`** — 13 kebab-case section slugs (12 KNOWLEDGE sections + `general-wisdom`). Same slugs accepted as `/pastiche-setup --section <slug>`. State flips from `stub` → `done` as setup walks each section.

Removed from v1 (vs. earlier drafts): `pastiche_version` (no v0/v2 to compare against), `fact_extractor` (only one extractor in v1; see §14.1). Both return in v1.x when a real comparison target exists.

`pastiche sync` re-reads this file — adding a `packages` or `tokens` entry causes the next sync to re-extract from the new source; switching `platform` regenerates adapters for the new platform.

Per-field reference for the release docs lives in `docs/config.md`, which hydrates from §9.4.1 plus the field semantics above.

### 9.4.1 Stack scenarios

v1 supports four combinations of component-source mode (`types` or `source_dir`) × token format (`tailwind-v4-theme` or `css-vars`). Other shapes (`types_glob` per-file `.d.ts`, `tailwind-v3-config`, `dtcg-json`, `js-export`, `classes`-as-format, per-entry `exclude`/`prefix`) are deferred to v1.x and fail-closed at lint time with clear error messages.

**Scenario 1 — monorepo with aggregate `.d.ts` + Tailwind v4 theme** (e.g. KISA-style internal DS)

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

**Scenario 2 — npm aggregate `.d.ts` + CSS-vars token files** (e.g. Primer; MUI with custom CSS vars)

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

**Scenario 3 — shadcn-style source-walk + Tailwind v4** (the canonical 2026 React/Tailwind setup)

```yaml
platform: claude-code
packages:
  - name: ui
    source_dir: src/components/ui
tokens:
  - format: tailwind-v4-theme
    source: src/app/globals.css
```

**Scenario 4 — shadcn source-walk + multiple token files**

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

Cross-scenario notes:

- Ordering in `packages` is preserved; on duplicate component-name exports, the first-listed entry wins (deterministic for FACT output and reviewer reads).
- For `css-vars`, both `--*` custom properties and class selectors (`.btn-primary`, `.text-h1`) declared in the same file are harvested as token-atoms. The same is true for `tailwind-v4-theme`. There is no separate `classes` format in v1.
- Multiple `tokens` entries layer freely (Tailwind theme + brand overrides + dark-mode stylesheet).

---

## 10. Adoption Flow

The happy path from clean repo to first gating loop:

1. **Install pastiche** — `npm install -D pastiche` (or `pnpm add -D pastiche`).
2. **`npx pastiche init`** — prompts for platform (single-select), scaffolds `pastiche/{FACT,KNOWLEDGE,WISDOM,config}.{md,yaml}`, runs FACT extractor, generates adapter files.
3. **`/pastiche-setup` in the agent of choice (Claude Code or Codex)** — detects DESIGN.md and asks opt-in; walks the canonical 12 KNOWLEDGE sections progressively; asks `[GENERAL]` WISDOM questions. Adopter can run section-by-section across multiple sessions.
4. **Use** — frontend tasks invoke the `pastiche` skill (manually or via skill triggering); the loop runs; output ships with optional Follow-ups.
5. **Maintain** — Follow-ups tagged `knowledge-gap` route to `/pastiche-write-knowledge`; `wisdom-gap` to `/pastiche-write-wisdom`. Free-form additions use the same skills.
6. **CI** — wire `pastiche lint` and `pastiche sync --dry-run` into the adopter's CI pipeline. Codebase changes that rename or remove DS atoms fail lint until KNOWLEDGE/WISDOM are updated.

---

## 11. DESIGN.md Handling

DESIGN.md is the lineage pastiche descends from (philosophical spec §1). Adopters arriving from a DESIGN.md workflow are a meaningful warm-lead audience. v1 honors this with **limited, principled** support:

### 11.1 Where DESIGN.md handling lives

**In the `pastiche-setup` skill, not in `pastiche init`.** Setup is the right home because:

- The conversion is conversational (which atoms map to which DESIGN.md tokens? does this DESIGN.md pattern map cleanly?), not mechanical.
- Init must stay fast and side-effect-bounded; adding LLM-mediated work there bloats the install path.
- The opt-in question is one the adopter only needs to answer once per setup, and the flag persists in config.

### 11.2 What is mechanical, what is not

**Mechanical (auto-port):**
- DESIGN.md's brand-identity prose → KNOWLEDGE.md's `## Brand Identity` section. One-shot copy. No LLM. Performed by the setup skill when the adopter opts in.

**Not mechanical (LLM-mediated grilling):**
- DESIGN.md's token list → cross-referenced against FACT-extracted tokens during the section walk. Setup asks: *"DESIGN.md lists `color.brand.primary`; FACT has `--color-primary`. Same token?"*
- DESIGN.md's component patterns → grill ammunition for KNOWLEDGE scenario mappings. Setup asks: *"DESIGN.md describes a 'data table' pattern; which atoms from FACT compose it for you?"*

**Never:**
- DESIGN.md → FACT.md. FACT is auto-extracted from running code, always. DESIGN.md is a reference document; running code is truth. If they diverge, code wins. Mechanically generating FACT from DESIGN.md risks shipping entries that don't exist in the library.

### 11.3 Config flag

The opt-in writes `design_md_reference: ./DESIGN.md` (or another in-repo path) into `pastiche/config.yaml`. Write-time path safety: `pastiche-setup` resolves the path to absolute, verifies the file exists and is readable, and asserts it lives inside the consumer repo (rejects `..` traversal). Read-time checks apply symmetrically — on failure, the skill warns and proceeds as if `null`, rather than crashing. Future invocations of `pastiche-setup` read the flag and continue using DESIGN.md as reference without re-asking. Adopters can remove the flag manually to opt back out.

---

## 12. Examples Strategy

### 12.1 In-tree reference adoption: `examples/primer-react/`

A small Next.js app using `@primer/react` (GitHub's open-source design system) as the DS, with a fully populated `pastiche/{FACT,KNOWLEDGE,WISDOM}.md`. Used both as a teaching example in the README and as the e2e regression target for the CLI and lint.

**Scope:**
- 5–8 components total, drawn from Primer.
- One example each of the three failure modes (component omission, token omission, wrong choice) demonstrated through committed task artifacts (input → loop output → final diff).
- Hand-curated illustrative KNOWLEDGE entries across the canonical 12 sections.
- Hand-curated illustrative WISDOM entries (5–8 atom-tagged + 2–3 `[GENERAL]`).

**Disclaimers (loud):**
- README of `examples/primer-react/` opens with: *"Reference adoption — **not affiliated with or endorsed by GitHub**. Used to demonstrate pastiche against a real, published design system."*
- WISDOM/KNOWLEDGE entries carry a banner: *"Illustrative entries curated by the pastiche maintainers — not official Primer guidance."*

**Maintenance:**
- Pin to a specific `@primer/react` version.
- Update on a slow cadence; don't promise tracking head.

### 12.2 External production adopter: KISA

Linked from the top-level README under "Production adopters":

> Used in production at: **KISA Design System** (link).

No content imported. KISA stays sovereign over its own pastiche docs. The link is the credibility.

### 12.3 Future examples

Post-v1: additional fixtures (shadcn/ui-flavored, brand-specific, multi-package) can join `examples/`. Not a v1 deliverable.

---

## 13. Deferred / Out of Scope for v1

| Item | Why deferred | Likely v |
|---|---|---|
| Gemini CLI adapter | Subagents shipped; adapter trivial but unbuilt. Want v1 to be tight. | v1.1 |
| Cursor adapter | Degraded mode (no subagent primitive). v1 does not ship degraded modes. | Community |
| Aider adapter | Same as Cursor. | Community |
| Other agent shells (hermes, ohmyopencode, etc.) | Same architectural class. | Community |
| `pastiche import --from design-md` standalone CLI verb | DESIGN.md handling in v1 is inside the setup skill. Standalone import verb is a future split if real adoption demand warrants. | v1.x |
| Multi-language / non-TS FACT extractors | v1 ships TS-types extractor only. Contract is documented; community can contribute. | Community |
| Storybook-based FACT extractor | Specific case of above. | Community |
| Atom-tagged WISDOM seeding tooling | WISDOM must grow organically (philosophical spec §3.3). Seeding it mechanically degrades the discipline. | Never |
| Aesthetic review skill | Separate, on-demand skill outside the gating loop (philosophical spec §15). | v2 |
| Reverse KNOWLEDGE (auto-generated reverse-knowledge in WISDOM) | Philosophical spec §16 — deferred until speculative doubt proves insufficient. | Conditional |
| Three-round loop with exit ritual | Philosophical spec §7.5 — bump path if two rounds prove insufficient. | Conditional |
| Strong-no abuse mitigation `pastiche-reviewer` re-flag | Philosophical spec §7.7 — conditional on empirical signal. | Conditional |

---

## 14. Open Questions (Decisions to Make During Implementation)

These were not resolved during the grill and are deliberately left open for the implementation phase. They do not block v1 scope decisions.

### 14.1 FACT extractor pluggability

v1 ships a TypeScript-types extractor only, hard-coded in `scripts/extract-fact-ts.ts`. The `fact_extractor` config field was **dropped from the v1 schema** (task 2.4 decision): a field with one legal value is theatrical until a second extractor exists.

The plugin contract stays on the v1.x roadmap. When a second extractor lands (Storybook-derived, Vue SFC, CSS-only, etc.), the `fact_extractor` field returns with two legal values *and* a documented plugin-resolution contract at `docs/contributing/adding-an-extractor.md`. Schema-additive change at that time, non-breaking for v1 adopters.

Until then, the CLI invokes `scripts/extract-fact-ts.ts` unconditionally.

### 14.2 CLI implementation language

Options: Node.js (broadest reach for FE projects), Bun (faster, less universal), Deno (no install for users with Deno), Go/Rust (single binary, no runtime dependency).

Recommendation: **Node.js** — the audience is FE teams that already have Node. Deferred to implementation.

### 14.3 Adapter generator implementation

How the canonical-source-+-template build is actually implemented:

- **Templates as Mustache/Handlebars files** — simple, declarative, but adds a template-engine dependency.
- **Templates as TypeScript functions** — code, not data; more flexible but less obviously hackable.
- **Templates as markdown with frontmatter placeholders** — minimal dependency, awkward for TOML output.

Recommendation: defer. TypeScript functions are likely the right call given the variety across YAML / TOML / different envelopes, but this is an implementation taste call.

### 14.4 Codex skill format — RESOLVED (2026-05-16)

Codex skills are directories under `.agents/skills/<name>/` containing a `SKILL.md` with YAML frontmatter (`name`, `description`) and a markdown body — shape-identical to Claude Code skills, only the output path differs. Pastiche ships its four user-facing skills as Codex Skills (not as an `AGENTS.md` fragment, since AGENTS.md is always-loaded and pastiche is on-demand). Subagents remain `.codex/agents/*.toml` with the canonical agent body embedded in `developer_instructions = """..."""`. See `docs/adapters/codex.md` for the full contract.

### 14.5 Licensing

Recommendation: **MIT**, matching the broader OSS-skill repo ecosystem (Anthropic's skills, wshobson/agents, etc.). Deferred to implementation.

### 14.6 Package distribution

Options: npm package (`pastiche`), Claude Code plugin (`.claude-plugin/`), or both.

Recommendation: **both**. The npm package is the primary distribution path (gives the CLI a home and supports non-Claude platforms). The Claude plugin entry makes Claude Code adoption a one-command install (`/plugin install pastiche`). The plugin's `plugin.json` points at the same skill/agent files as the npm package's installer writes.

Deferred to implementation; commit to "both" as the goal.

### 14.7 KISA migration

Post-publish, umichkisa-ds migrates from its in-repo pastiche installation to consuming the published `pastiche` package. The migration is **deferred** — for now, the OSS extract is copy-paste from umichkisa-ds; umichkisa-ds is not touched. Migration happens after pastiche v1 ships and is validated independently.

---

## 15. Acceptance Criteria for v1 Release

The OSS extract is ready to publish when all eight gates pass against **Claude Code** as the primary platform. Codex artifacts ship as a placeholder (§2.2) and are not validated for v1.

1. A new (non-KISA) repository can run `npx pastiche init` and arrive at a working pastiche installation in one command on Claude Code. The same command emits Codex artifacts when `--platforms codex` is selected, but their runtime correctness is not part of this acceptance gate.
2. `/pastiche-setup` walks the 12 KNOWLEDGE sections + `[GENERAL]` WISDOM questions interactively, with optional DESIGN.md reference.
3. The `pastiche` skill runs the three-agent loop end-to-end against the `examples/primer-react/` fixture on Claude Code, producing the expected report shape.
4. `/pastiche-write-knowledge` and `/pastiche-write-wisdom` can add entries that round-trip through `pastiche lint`.
5. `pastiche lint` fails closed on tag/section/reference violations with clear errors.
6. `pastiche sync` is idempotent across two consecutive runs.
7. The Primer fixture has a non-affiliation banner; KISA is linked in the README as a production adopter.
8. Documentation covers: README (positioning + quickstart, with Codex placeholder status called out), this spec, the philosophical spec, per-document format docs, adapter overview, contributing guide.

When all eight are true, v1 ships. Codex runtime validation is tracked separately as a v1.x community-driven milestone.
