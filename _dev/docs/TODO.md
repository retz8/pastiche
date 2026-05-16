# Pastiche OSS v1 — TODO

Sequenced delivery plan for shipping v1 of pastiche, derived from `OSS_SPEC.md`. Phases run in order; tasks within a phase can parallelize unless noted.

---

## Phase 0 — Research (blocker)

- [x] **0.1** **Codex skill format research** (OSS_SPEC §14.4): findings written to `docs/adapters/codex.md` (2026-05-16). Decision: pastiche skills → `.agents/skills/<name>/SKILL.md` (YAML frontmatter, identical shape to Claude Code skills); subagents → `.codex/agents/*.toml` with canonical body in `developer_instructions`. No `AGENTS.md` fragment. OSS_SPEC §4.4 and §14.4 updated. Phase 3 Codex tasks unblocked.

---

## Phase 1 — Canonical sources (generalize from `_dev/`)

- [x] **1.1** Port `_dev/spec.md` → `spec.md` (de-KISA pass).
- [x] **1.2** `_dev/agents/pastiche-implementer-round1.md` → `agents/pastiche-implementer-round1.md` + `.meta.yaml` sidecar (strip frontmatter, KISA atoms/paths, Claude-Code-specific tool names).
- [ ] [WIP] **1.3** `_dev/agents/pastiche-implementer-round2.md` → `agents/pastiche-implementer-round2.md` + `.meta.yaml` sidecar (same).
- [ ] **1.4** `_dev/agents/pastiche-reviewer.md` → `agents/pastiche-reviewer.md` + `.meta.yaml` sidecar (same).
- [x] **1.5** `_dev/skills/pastiche/SKILL.md` → `skills/pastiche.md` (canonical orchestrator body; strip Claude-Code framing).
- [ ] **1.6** Author `skills/pastiche-setup.md` (OSS_SPEC §7.2, §11).
- [ ] **1.7** Author `skills/pastiche-write-knowledge.md` (§7.3).
- [ ] **1.8** Author `skills/pastiche-write-wisdom.md` (§7.4).

---

## Phase 2 — Templates

- [ ] **2.1** Generalize `templates/FACT.md` (extractor banner only; §9.1).
- [ ] **2.2** Generalize `templates/KNOWLEDGE.md` with the canonical 12 H2 stubs (§9.2).
- [ ] **2.3** Generalize `templates/WISDOM.md` (header + commented `[GENERAL]` suggestions; §9.3).
- [ ] **2.4** Author `templates/pastiche.config.yaml` per §9.4.

---

## Phase 3 — Adapters (canonical + build, §4)

- [ ] **3.1** `adapters/claude-code/agents.template` — YAML frontmatter wrapper.
- [ ] **3.2** `adapters/claude-code/skills.template` — `SKILL.md` wrapper.
- [ ] **3.3** `adapters/codex/agents.template` — TOML wrapper. *Depends on Phase 0.*
- [ ] **3.4** `adapters/codex/skills.template`. *Depends on Phase 0.*

---

## Phase 4 — Scripts

- [ ] **4.1** Promote extractor → `scripts/extract-fact-ts.ts`; drive paths from `ds_module_paths` in config; remove KISA-specific assumptions.
- [ ] **4.2** Promote lint → `scripts/lint.ts` (+ port test); add KNOWLEDGE canonical-section-presence enforcement (§6.3 step 4).

---

## Phase 5 — CLI (`cli/src/`, Node + TS per §14.2)

- [ ] **5.1** Bootstrap CLI package with `bin: pastiche`.
- [ ] **5.2** Adapter generator module — canonical body + template → emit final file (§14.3 implementation TBD; lean toward TS functions).
- [ ] **5.3** Pluggable FACT extractor contract — `fact_extractor: ts-types` resolves via documented contract (§14.1 option b).
- [ ] **5.4** Implement `pastiche init` (§6.1): platform prompt, scaffold `pastiche/` + config, run extractor, generate adapter files.
- [ ] **5.5** Implement `pastiche sync` (§6.2): re-extract + regenerate adapters; idempotent; honors config edits.
- [ ] **5.6** Implement `pastiche lint` (§6.3): wraps Phase 4 lint; fail-closed with clear errors.

---

## Phase 6 — Reference adoption: `examples/primer-react/` (§12)

- [ ] **6.1** Scaffold Next.js + `@primer/react` demo app (5–8 components; pin Primer version).
- [ ] **6.2** Run `pastiche init` against it; commit the resulting `FACT.md`.
- [ ] **6.3** Hand-curate illustrative `KNOWLEDGE.md` across the canonical 12 sections.
- [ ] **6.4** Hand-curate illustrative `WISDOM.md` (5–8 atom-tagged + 2–3 `[GENERAL]`).
- [ ] **6.5** Commit one task artifact per failure mode (component omission, token omission, wrong choice) — input → loop output → final diff.
- [ ] **6.6** Add non-affiliation banners (fixture README + KNOWLEDGE/WISDOM headers).
- [ ] **6.7** Extractor field-testing — run `scripts/extract-fact-ts.ts` against ≥3 varied real-world FE codebases (different DS shapes, generics, re-exports, namespaced components). Document gaps; iterate the extractor until coverage is acceptable. Defers the question of a manual FACT-overrides surface until empirical evidence justifies it.

---

## Phase 7 — Packaging & docs

- [ ] **7.1** `package.json` (npm) + `.claude-plugin/{plugin.json,marketplace.json}` — ship both (§14.6).
- [ ] **7.2** `README.md`: positioning, quickstart, KISA linked as production adopter.
- [ ] **7.3** Per-document format docs: `docs/fact.md`, `docs/knowledge.md`, `docs/wisdom.md`.
- [ ] **7.4** `docs/adapters/claude-code.md`; finalize `docs/adapters/codex.md` (from Phase 0).
- [ ] **7.5** `docs/contributing/adding-an-extractor.md` (extractor plugin contract).
- [ ] **7.6** `LICENSE` — MIT (§14.5).

---

## Phase 8 — Release gate

- [ ] **8.1** Dedicated `spec.md` editing pass — accumulate changes discovered during phases 1–7 and revise the philosophical spec in a single focused session. The Phase 1 port is a mechanical de-KISA only; substantive revisions happen here.
- [ ] **8.2** Run OSS_SPEC §15 eight-point acceptance checklist end-to-end against `examples/primer-react/`.
- [ ] **8.3** Verify `_dev/` is empty (sources are deleted per Rule 5 as they're ported) and remove the tree, once §15 is green.
- [ ] **8.4** Ship v1.
