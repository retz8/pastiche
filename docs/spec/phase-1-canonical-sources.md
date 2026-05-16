# Phase 1 — Canonical Sources

Phase spec for Phase 1 of `_dev/docs/TODO.md`. Locks the decisions shared across every Phase 1 task. Per-task grillings inherit from this spec.

## Scope

Generalize the material under `_dev/` into canonical, project-agnostic sources at the repo root:

- `spec.md` (port from `_dev/spec.md`)
- `agents/round1.md`, `agents/round2.md`, `agents/reviewer.md` (port from `_dev/agents/*`)
- `skills/pastiche.md` (port from `_dev/skills/pastiche/SKILL.md`)
- `skills/pastiche-setup.md`, `skills/pastiche-write-knowledge.md`, `skills/pastiche-write-wisdom.md` (newly authored)

## Locked decisions

### 1. Agent metadata lives in sidecar manifests; skills keep universal SKILL.md frontmatter

- Canonical agent bodies are pure markdown with no frontmatter. Each is paired with a `<name>.meta.yaml` sidecar carrying `name`, `description`, `model`, and a neutral capability list. Adapter templates map the sidecar into platform-specific envelopes (Claude Code YAML frontmatter, Codex TOML).
- Canonical skill files are SKILL.md-shaped (YAML frontmatter + markdown body). The SKILL.md format is identical across Claude Code and Codex, so the adapter step for skills is path routing only — no envelope transformation, no sidecar.

### 2. No KISA in canonical files

Canonical sources never mention KISA, `umichkisa-ds`, `ds-client-constrained-execution`, or any project-specific atom names. Atom examples in the philosophical spec (`Button`, `Stack`, `Grid`, etc.) are cross-DS lingua franca and stay. The Phase 1 spec.md port is a mechanical de-KISA only; substantive revisions to `spec.md` are deferred to the dedicated Phase 8 polish session (added to TODO.md).

### 3. The three new skills are single in-session grill skills

`pastiche-setup`, `pastiche-write-knowledge`, and `pastiche-write-wisdom` are conversational authoring skills. They do not dispatch subagents. Length is determined by content; `pastiche-setup` in particular is grill-heavy and will be long. No shared preflight pattern across skills.

### 4. Authoring tooling

- The three new skills are authored with the `write-a-skill` skill, per CLAUDE.md Rule 2.
- The mechanical ports (`spec.md`, three agents, existing `pastiche` skill) are direct edits — no authoring skill required, since the canonical body already exists in `_dev/` and needs only the de-KISA / no-frontmatter pass.

## Invariants for this phase

- OSS_SPEC is the source of truth. Decisions not in OSS_SPEC and not in this phase spec must be surfaced in per-task grilling, not inferred.
- v1 targets JS/TS UI tasks; no multi-language consideration applies to canonical bodies in this phase.
- No file in this phase commits adapter output. Adapter templates and their outputs are Phase 3 deliverables.

## Per-task specs

Each Phase 1 task that needs decisions beyond this phase spec writes its own per-task spec at `docs/spec/<task-name>.md` (kebab-case), produced after a per-task `grill-me` session.
