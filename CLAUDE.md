# pastiche

## What this project is

Pastiche is a **Claude skill (and forthcoming OSS package) for faithful design-system execution** by LLM coding agents. Given a frontend task, it produces code that follows an established design system + component library — not by inventing, but by faithfully executing within the established vocabulary.

The skill operates over three documents that form an epistemological hierarchy:

- **FACT.md** — mechanical catalog of every token, component, and prop. Auto-extracted from the codebase.
- **KNOWLEDGE.md** — curated scenario→atom mappings (the "absent designer") + brand-identity prose.
- **WISDOM.md** — atom-tagged rules. Atom-intrinsic only; scenario-conditional rules live in KNOWLEDGE.

The runtime mechanism is a **bounded doubt-defense loop**: `pastiche-implementer-round1` produces code → `pastiche-reviewer` raises strict-YAML doubts → `pastiche-implementer-round2` corrects or defends. Depth comes from the dialogue, not from a heavy reviewer.

This repo is the **OSS extract** of pastiche, validated internally against the KISA design system. Everything currently lives under `_dev/` as a KISA-flavored staging area — nothing there is canonical yet. The v1 surface (CLI, skills, agents, templates, adapters) is defined in `_dev/docs/OSS_SPEC.md`. Sequenced delivery lives in `_dev/docs/TODO.md`.

**Required reading:** `_dev/spec.md` (philosophy), `_dev/docs/OSS_SPEC.md` (v1 delivery spec), `_dev/docs/TODO.md` (sequenced plan).

## How to work in this repo

### Daily work harness (TODO.md execution)

All work tracked in `_dev/docs/TODO.md` flows through this harness. Do not skip steps even if a task feels small.

**Rule 1 — Grill before every task.** Before touching any TODO item (port, author, implement, scaffold, etc.), run the `grill-me` skill to lock in scope and decisions. No file moves or writes until grilling is resolved.

**Rule 2 — "Author …" tasks → spec + dedicated skill.**
1. `grill-me` to lock decisions.
2. Write the locked decisions as a spec at `docs/spec/<task-name>.md` with `grill-to-spec` skill (kebab-case, e.g. `docs/spec/skills-pastiche-setup.md`).
3. Execute with the dedicated skill matched to the artifact type ( `write-a-skill` for skills). The spec is the input.

**Rule 3 — "Implement …" tasks → plan + execute.**
1. `grill-me` to lock decisions.
2. `writing-plans` (superpowers) to produce an implementation plan.
3. `executing-plans` (superpowers) to execute it. No freehand implementation.

**Rule 4 — Per-phase kickoff.** Before starting any phase in TODO.md, run a phase-level `grill-me` and write a phase spec at `docs/spec/phase-<n>-<short-name>.md` locking decisions shared across the phase's tasks. Per-task grillings inherit from it.

**Rule 5 — Delete the source after a successful port.** When a "Port `_dev/<x>` → `<y>`" task completes, delete `_dev/<x>` (and any newly-empty parent dirs) in the same commit. Do not leave staging files as tombstones — git history is the audit trail. TODO 8.3 then only removes whatever non-ported leftovers remain.

### Invariants

- **OSS_SPEC is the source of truth.** If a decision isn't in OSS_SPEC, surface it in grilling — don't infer. Open items are enumerated in OSS_SPEC §14.
- **Project-agnostic.** No canonical or adapter file embeds KISA atom names, paths, or phrasing. KISA atoms only appear in `examples/primer-react/` (the reference adoption — not yet built, see OSS_SPEC §12).
- **Canonical vs adapter discipline**: canonical sources are platform-agnostic markdown bodies; per-platform envelopes live in `adapters/<platform>/*.template`; built outputs are not committed.

### What this repo is not

Not a design system, not a general code reviewer, not a runtime UI protocol, not Claude-Code-only. v1 targets Claude Code + Codex.

## Reference

**Origin:** `umichkisa-ds` (KISA Design System, `/Users/jiohin/desktop/kisa/devteam/dev/umichkisa-ds`) — validation testbed. Source material for this extract lives under `umichkisa-ds/pastiche/` and `umichkisa-ds/.claude/{skills,agents}/pastiche*`.
