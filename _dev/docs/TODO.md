# Pastiche OSS v1 — TODO

Sequenced delivery plan for shipping v1 of pastiche, derived from `OSS_SPEC.md`. Phases run in order; tasks within a phase can parallelize unless noted.

> **Plugin-first pivot (2026-05-20, locked in Phase 4 grill — see `docs/spec/phase-4-scripts.md`):** v1 ships as a Claude Code plugin only. No npm package, no standalone CLI binary, no Rust. `pastiche init`/`sync`/`lint` become slash-command skills inside the plugin; bundled JS (extractor, lint) is invoked from skill bodies via `node $CLAUDE_PLUGIN_ROOT/dist/*.js`. Phase 8 (formerly 7) contains pre-pivot wording — flagged inline below; it will be restructured by its own phase grill. OSS_SPEC sweep happens in Phase 9.1.
>
> **Phase 6 restructure (2026-05-23, locked in `docs/spec/phase-6-reference-adoption.md`):** Phase 6 now targets `examples/github-primer-react/`. New tasks 6.0 (plugin packaging slice, pulled forward from old 7.1) and 6.2.5 (primer.style research session). Old 6.7 extracted to a new Phase 7 (extractor field-testing). Old Phases 7 and 8 renumber to 8 and 9. Bundler choice in Phase 4 spec amended from `bun build` to `tsup`.

---

## Phase 0 — Research (blocker)

- [x] **0.1** **Codex skill format research** (OSS_SPEC §14.4): findings written to `docs/adapters/codex.md` (2026-05-16). Decision: pastiche skills → `.agents/skills/<name>/SKILL.md` (YAML frontmatter, identical shape to Claude Code skills); subagents → `.codex/agents/*.toml` with canonical body in `developer_instructions`. No `AGENTS.md` fragment. OSS_SPEC §4.4 and §14.4 updated. Phase 3 Codex tasks unblocked.

---

## Phase 1 — Canonical sources (generalize from `_dev/`)

- [x] **1.1** Port `_dev/spec.md` → `spec.md` (de-KISA pass).
- [x] **1.2** `_dev/agents/pastiche-implementer-round1.md` → `agents/pastiche-implementer-round1.md` + `.meta.yaml` sidecar (strip frontmatter, KISA atoms/paths, Claude-Code-specific tool names).
- [x] **1.3** `_dev/agents/pastiche-implementer-round2.md` → `agents/pastiche-implementer-round2.md` + `.claude-code.meta.yaml` + `.codex.meta.yaml` sidecars (same).
- [x] **1.4** `_dev/agents/pastiche-reviewer.md` → `agents/pastiche-reviewer.md` + `.claude-code.meta.yaml` + `.codex.meta.yaml` sidecars (same).
- [x] **1.5** `_dev/skills/pastiche/SKILL.md` → `skills/pastiche.md` (canonical orchestrator body; strip Claude-Code framing).

---

## Phase 2 — Templates + skills that depend on them

> **Sequencing note:** Phase 1 canonical bodies were authored before this phase's templates were finalized, which inverted the real dependency — the skills/agents bake in template-shaped read patterns (Brand Identity load, section grep, FACT/WISDOM bullet shape). Tasks 2.5, 2.6, 2.7 were therefore moved here from Phase 1; task 2.8 is the closer that sweeps the rest of Phase 1 for template-shape drift.
>
> Dependencies:
> - **2.5** depends on **2.2**.
> - **2.6** depends on **2.3**. Completed pre-2.3 as task 1.8 (spec at `docs/spec/task-1.8-pastiche-write-wisdom.md`); revisit covered by 2.8.
> - **2.7** depends on **2.1 + 2.2 + 2.3 + 2.4** (it orchestrates all three documents and reads config).
> - **2.8** depends on **2.1 + 2.2 + 2.3**.

- [x] **2.1** Generalize `templates/FACT.md` (extractor banner only; §9.1).
- [x] **2.2** Generalize `templates/KNOWLEDGE.md` with the canonical 12 H2 stubs (§9.2).
- [x] **2.3** Generalize `templates/WISDOM.md` (header + commented `[GENERAL]` suggestions; §9.3).
- [x] **2.4** Author `templates/config.yaml` per §9.4 (consumer path `pastiche/config.yaml`; schema rewritten — see `docs/spec/task-2.4-config-template.md`).
- [x] **2.5** Author `skills/pastiche-write-knowledge.md` (§7.3). *Depends on 2.2.*
- [x] **2.6** Author `skills/pastiche-write-wisdom.md` (§7.4). *Depends on 2.3; revisit via 2.8.*
- [x] **2.7** Author `skills/pastiche-setup.md` (OSS_SPEC §7.2, §11). *Formerly task 1.6. Depends on 2.1–2.4.*
- [x] **2.8** Revisit Phase 1 canonical bodies against finalized templates — sweep `agents/pastiche-implementer-round1.md`, `agents/pastiche-implementer-round2.md`, `agents/pastiche-reviewer.md`, `skills/pastiche.md`, and `skills/pastiche-write-wisdom.md` (2.6) for template-shape drift introduced by 2.1–2.3.

---

## Phase 3 — Adapters (canonical + build, §4)

- [x] **3.1** `adapters/claude-code/agents.template` — YAML frontmatter wrapper.
- [x] **3.2** ~~`adapters/claude-code/skills.template`~~ — resolved as **no skills adapter needed**; OSS_SPEC §4.3/§4.4/§4.5 amended. See `docs/spec/task-3.2-skills-no-adapter.md`.
- [x] **3.3** `adapters/codex/agents.template` — TOML wrapper. *Depends on Phase 0.*
- [x] **3.4** ~~`adapters/codex/skills.template`~~ — closed by 3.2; skills ship without per-platform adapters. See `docs/spec/task-3.2-skills-no-adapter.md`.

---

## Phase 4 — Scripts

- [x] **4.1** Promote extractor → `scripts/extract-fact-ts.ts`; drive inputs from `packages` (with `types` + `source_dir` modes) and `tokens` (list of CSS file paths) per §9.4 / §9.4.1; add source-directory walking and plain `:root` CSS-vars parsing; remove KISA-specific assumptions.
- [x] **4.2** Promote lint → `scripts/lint.ts` (+ port test); add KNOWLEDGE canonical-section-presence enforcement (§6.3 step 4).
- [x] **4.3** Pivot-alignment sweep of Phase 1–3 artifacts. Audit `skills/*.md`, `agents/*.md`, `templates/*`, and `adapters/**/*.template` for pre-pivot wording per `docs/spec/phase-4-scripts.md`: references to `pastiche init`/`sync`/`lint` as CLI commands → slash-command skills (`/pastiche-init`, etc.); references to npm install / `npx pastiche` → Claude plugin install; any phrasing that assumes a standalone CLI binary exists. Patch in place; this is a wording sweep, not a re-design. Per-task grill scope-only (no spec needed). Must complete before Phase 5/7 grills so they inherit clean phrasing.

---

## Phase 5 — Plugin slash-command skills

> Restructured 2026-05-23 per `docs/spec/phase-5-skills.md`. Old 5.1 (CLI bootstrap) and old 5.2 (adapter generator) dropped under plugin-first. Old 5.3 (extractor contract doc) relocated to Phase 7 / merged with 7.5. Phase 4 open item 2 (lint hook) killed — lint runs from inside mutator skills + manually via `/pastiche-lint`. All four tasks parallelize.

- [x] **5.1** Author `skills/pastiche-init.md` — scaffold `pastiche/{config.yaml, FACT.md, KNOWLEDGE.md, WISDOM.md}`, run extractor; no lint, no chain to `/pastiche-setup`.
- [x] **5.2** Author `skills/pastiche-sync.md` — re-run extractor, overwrite `FACT.md`, run lint as self-check, report drift. FACT-only; no remediation.
- [x] **5.3** Author `skills/pastiche-lint.md` — manual entry point wrapping `dist/lint.js`.
- [x] **5.4** Amend `skills/pastiche-setup.md`, `skills/pastiche-write-knowledge.md`, `skills/pastiche-write-wisdom.md` to invoke `dist/lint.js` as a self-check at end of mutation (fail-warn, plain text, no auto-fix).

---

## Phase 6 — Reference adoption: `examples/github-primer-react/` (§12)

> Restructured 2026-05-23 per `docs/spec/phase-6-reference-adoption.md`. Original 6.7 (extractor field-testing) extracted to new Phase 7. Old 7.1 plugin-packaging chunk pulled forward into new task 6.0. New task 6.2.5 adds a dedicated primer.style research session. Original "5–8 components" cap dropped — scaffold uses whatever a realistic app needs. Example name corrected from `primer-react/` to `github-primer-react/`.
>
> **6.0 split (2026-05-24, locked in `docs/spec/task-6.0a-rust-lint.md` + `docs/spec/task-6.0b-build-script.md`):** 6.0 split into 6.0a (Rust lint binary — rewrite `lint.ts` to native `pastiche-lint` in `bin/`) and 6.0b (build script + plugin packaging). Lint converted to Rust for speed and token savings across mutator skills. `tsup` only bundles the extractor; lint ships as a compiled binary. 6.0b depends on 6.0a.

- [x] **6.0a** Rust lint binary — rewrite `scripts/lint.ts` as a Rust binary (`pastiche-lint`) at `rust/pastiche-lint/`, port tests, sweep five skill bodies (`node $CLAUDE_PLUGIN_ROOT/dist/lint.js` → `pastiche-lint`), delete superseded TS sources. Spec: `docs/spec/task-6.0a-rust-lint.md`.
- [ ] [WIP] **6.0b** Plugin packaging slice — `scripts/build.ts` orchestrator (via `tsx`), `tsup.config.ts`, `dist-plugin/` layout (gitignored), minimal `plugin.json`, bundling of `extract-fact-ts.ts` → `dist/extract-fact.js` via `tsup`, Rust binary copy to `bin/pastiche-lint`. Spec: `docs/spec/task-6.0b-build-script.md`. *Depends on 6.0a.*
- [ ] **6.1** Scaffold Next.js (app router) + `@primer/react` (exact-pinned) + TypeScript skeleton at `examples/github-primer-react/`; symlink-install plugin via `.claude/plugins/pastiche` → `../../../dist-plugin/`. *Depends on 6.0b.*
- [ ] **6.2** Run `/pastiche-init` against it; commit the resulting `pastiche/{config.yaml, FACT.md}`.
- [ ] **6.2.5** Deep research session on primer.style → human-readable research doc at `examples/github-primer-react/docs/primer-research.md`. Upstream of KNOWLEDGE/WISDOM curation; also prototype evidence for a future research-from-docs `pastiche-setup` mode.
- [ ] **6.3** KNOWLEDGE skeleton pass — one or two entries per canonical 12 sections, distilled from 6.2.5. Lint-clean.
- [ ] **6.4** WISDOM skeleton pass — 3–5 atom-tagged rules, distilled from 6.2.5. Parallel-eligible with 6.3.
- [ ] **6.5** Run pastiche tasks against the example app (KNOWLEDGE/WISDOM deepen JIT; findings logged to `docs/phase-6-findings.md`). Cherry-pick three best invocations as failure-mode artifacts (component omission, token omission, wrong choice) at `examples/github-primer-react/artifacts/<NN>-<failure-mode>/` with input/round1/reviewer/round2/final.
- [ ] **6.6** Non-affiliation banners — example README + KNOWLEDGE/WISDOM headers + research doc header. Parallel-eligible throughout.

---

## Phase 7 — Extractor field-testing

> Extracted from old 6.7 per `docs/spec/phase-6-reference-adoption.md`. Per-phase grill required.

- [ ] **7.1** Stress-test `scripts/extract-fact-ts.ts` against ≥3 varied real-world FE codebases (different DS shapes, generics, re-exports, namespaced components). Document gaps; iterate the extractor until coverage is acceptable. Defers the question of a manual FACT-overrides surface until empirical evidence justifies it.

---

## Phase 8 — Packaging & docs

> Renumbered from old Phase 7. **⚠ Pre-pivot wording remains in tasks below.** Plugin-only distribution per Phase 4 spec. Old 7.1 plugin packaging is partially complete via Phase 6.0 (build orchestrator, `dist-plugin/` layout, minimal `plugin.json`, bundling) — what remains here is `marketplace.json`, version metadata, and release polish. Per-phase grill required.

- [ ] **8.1** Plugin release polish: harden `.claude-plugin/plugin.json` (description, version), add `.claude-plugin/marketplace.json` (§14.6). Build orchestrator + minimal manifest already shipped in Phase 6.0.
- [ ] **8.2** `README.md`: positioning, quickstart, KISA linked as production adopter.
- [ ] **8.3** Per-document format docs: `docs/fact.md`, `docs/knowledge.md`, `docs/wisdom.md`, `docs/config.md` (hydrates from OSS_SPEC §9.4 + §9.4.1 — four stack scenarios + field semantics).
- [ ] **8.4** `docs/adapters/claude-code.md`; finalize `docs/adapters/codex.md` (from Phase 0).
- [ ] **8.5** `docs/contributing/adding-an-extractor.md` (extractor plugin contract). *Absorbed old 5.3 per `docs/spec/phase-5-skills.md`: design + document the pluggable FACT extractor contract; the `fact_extractor` config field (dropped in task 2.4) is reintroduced alongside this contract when a second extractor lands; v1 hard-codes `dist/extract-fact.js`. See OSS_SPEC §14.1.*
- [ ] **8.6** `LICENSE` — MIT (§14.5).

---

## Phase 9 — Release gate

> Renumbered from old Phase 8.

- [ ] **9.1** Dedicated `spec.md` editing pass — accumulate changes discovered during phases 1–8 and revise the philosophical spec in a single focused session. The Phase 1 port is a mechanical de-KISA only; substantive revisions happen here.
- [ ] **9.2** Run OSS_SPEC §15 eight-point acceptance checklist end-to-end against `examples/github-primer-react/` **on Claude Code only**. Codex is shipped as placeholder per OSS_SPEC §2.2; runtime validation deferred to a v1.x community milestone. Per Phase 4 spec open item (2), acceptance criterion #5 (CI lint) softens to adopter-side hook-based enforcement; the 9.1 spec-editing pass updates §15 accordingly.
- [ ] **9.3** Verify `_dev/` is empty (sources are deleted per Rule 5 as they're ported) and remove the tree, once §15 is green.
- [ ] **9.4** Ship v1.
