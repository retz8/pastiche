# Pastiche OSS v1 — TODO

Sequenced delivery plan for shipping v1 of pastiche, derived from `OSS_SPEC.md`. Phases run in order; tasks within a phase can parallelize unless noted.

---

## Phase 0 — Research (blocker)

- [x] **Codex skill format research** (OSS_SPEC §14.4): findings written to `docs/adapters/codex.md` (2026-05-16). Decision: pastiche skills → `.agents/skills/<name>/SKILL.md` (YAML frontmatter, identical shape to Claude Code skills); subagents → `.codex/agents/*.toml` with canonical body in `developer_instructions`. No `AGENTS.md` fragment. OSS_SPEC §4.4 and §14.4 updated. Phase 3 Codex tasks unblocked.

---

## Phase 1 — Canonical sources (generalize from `_dev/`)

- [ ] Port `_dev/spec.md` → `spec.md` (de-KISA pass).
- [ ] `_dev/agents/pastiche-implementer-round1.md` → `agents/round1.md` (strip frontmatter, KISA atoms/paths, Claude-Code-specific tool names).
- [ ] `_dev/agents/pastiche-implementer-round2.md` → `agents/round2.md` (same).
- [ ] `_dev/agents/pastiche-reviewer.md` → `agents/reviewer.md` (same).
- [ ] `_dev/skills/pastiche/SKILL.md` → `skills/pastiche.md` (canonical orchestrator body; strip Claude-Code framing).
- [ ] Author `skills/pastiche-setup.md` (OSS_SPEC §7.2, §11).
- [ ] Author `skills/pastiche-write-knowledge.md` (§7.3).
- [ ] Author `skills/pastiche-write-wisdom.md` (§7.4).

---

## Phase 2 — Templates

- [ ] Generalize `templates/FACT.md` (extractor banner only; §9.1).
- [ ] Generalize `templates/KNOWLEDGE.md` with the canonical 12 H2 stubs (§9.2).
- [ ] Generalize `templates/WISDOM.md` (header + commented `[GENERAL]` suggestions; §9.3).
- [ ] Author `templates/pastiche.config.yaml` per §9.4.

---

## Phase 3 — Adapters (canonical + build, §4)

- [ ] `adapters/claude-code/agents.template` — YAML frontmatter wrapper.
- [ ] `adapters/claude-code/skills.template` — `SKILL.md` wrapper.
- [ ] `adapters/codex/agents.template` — TOML wrapper. *Depends on Phase 0.*
- [ ] `adapters/codex/skills.template`. *Depends on Phase 0.*

---

## Phase 4 — Scripts

- [ ] Promote extractor → `scripts/extract-fact-ts.ts`; drive paths from `ds_module_paths` in config; remove KISA-specific assumptions.
- [ ] Promote lint → `scripts/lint.ts` (+ port test); add KNOWLEDGE canonical-section-presence enforcement (§6.3 step 4).

---

## Phase 5 — CLI (`cli/src/`, Node + TS per §14.2)

- [ ] Bootstrap CLI package with `bin: pastiche`.
- [ ] Adapter generator module — canonical body + template → emit final file (§14.3 implementation TBD; lean toward TS functions).
- [ ] Pluggable FACT extractor contract — `fact_extractor: ts-types` resolves via documented contract (§14.1 option b).
- [ ] Implement `pastiche init` (§6.1): platform prompt, scaffold `pastiche/` + config, run extractor, generate adapter files.
- [ ] Implement `pastiche sync` (§6.2): re-extract + regenerate adapters; idempotent; honors config edits.
- [ ] Implement `pastiche lint` (§6.3): wraps Phase 4 lint; fail-closed with clear errors.

---

## Phase 6 — Reference adoption: `examples/primer-react/` (§12)

- [ ] Scaffold Next.js + `@primer/react` demo app (5–8 components; pin Primer version).
- [ ] Run `pastiche init` against it; commit the resulting `FACT.md`.
- [ ] Hand-curate illustrative `KNOWLEDGE.md` across the canonical 12 sections.
- [ ] Hand-curate illustrative `WISDOM.md` (5–8 atom-tagged + 2–3 `[GENERAL]`).
- [ ] Commit one task artifact per failure mode (component omission, token omission, wrong choice) — input → loop output → final diff.
- [ ] Add non-affiliation banners (fixture README + KNOWLEDGE/WISDOM headers).

---

## Phase 7 — Packaging & docs

- [ ] `package.json` (npm) + `.claude-plugin/{plugin.json,marketplace.json}` — ship both (§14.6).
- [ ] `README.md`: positioning, quickstart, KISA linked as production adopter.
- [ ] Per-document format docs: `docs/fact.md`, `docs/knowledge.md`, `docs/wisdom.md`.
- [ ] `docs/adapters/claude-code.md`; finalize `docs/adapters/codex.md` (from Phase 0).
- [ ] `docs/contributing/adding-an-extractor.md` (extractor plugin contract).
- [ ] `LICENSE` — MIT (§14.5).

---

## Phase 8 — Release gate

- [ ] Dedicated `spec.md` editing pass — accumulate changes discovered during phases 1–7 and revise the philosophical spec in a single focused session. The Phase 1 port is a mechanical de-KISA only; substantive revisions happen here.
- [ ] Run OSS_SPEC §15 eight-point acceptance checklist end-to-end against `examples/primer-react/`.
- [ ] Clean up `_dev/` (delete staging area) once all canonical files are promoted and the §15 gate is green.
- [ ] Ship v1.
