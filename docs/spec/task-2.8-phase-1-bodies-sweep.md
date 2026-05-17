# Task 2.8 — Phase 1 canonical bodies sweep

Per-task spec for TODO 2.8. Sweeps Phase 1 canonical bodies for template-shape drift introduced by tasks 2.1–2.3 and the format decisions locked in `docs/spec/phase-2-templates-and-skills.md`. Inherits all retrofit moves enumerated in phase-2 spec §13; this spec captures only what was resolved on top of it during grilling.

## Scope

Sweep set is four files:

- `agents/pastiche-implementer-round1.md`
- `agents/pastiche-implementer-round2.md`
- `agents/pastiche-reviewer.md`
- `skills/pastiche.md`

`skills/pastiche-write-wisdom.md` is excluded — already reviewed independently. Phase-2 spec §13's retrofit list for write-wisdom does not apply here.

## Locked decisions

### 1. Round-1 `gaps:` entries surface as orchestrator follow-ups

Each entry in round-1's `gaps:` line (locked decision 10b) becomes a `KNOWLEDGE.md — <scenario>` follow-up in `skills/pastiche.md`'s final response, alongside round-2's `(knowledge-gap)`-tagged entries from locked decision 10d. Matters in particular on the `[]`-doubts path where round-2 never runs — round-1's gap detection must not be a dead output.

### 2. Round-1 hard-constraint paragraph — drop the carve-out sentence

The third sentence of round-1's hard-constraint paragraph ("Re-grep is allowed only when a correction introduces a brand-new atom not in your original candidate set.") is round-2-flavored leakage — round-1 has no per-doubt correction flow, and typecheck patching is already covered by step 9's "do not grep FACT during this step." Drop that sentence. Tighten the remaining paragraph for verbosity at the same time.

### 3. Prompt conciseness — each agent body is independent

Agent and skill bodies sweep-edited under this task must stay concise. Each agent is independently dispatched; its body must not explain other agents' workflows, narrate the full pipeline, or duplicate orchestrator context. Trim redundant or over-explicit sentences during the sweep wherever they appear. This rule applies in addition to the specific retrofit moves in phase-2 spec §13.

## Invariants

- All retrofit moves enumerated in `docs/spec/phase-2-templates-and-skills.md` §13 for the four files in scope apply. This spec adds three resolutions on top; it does not override §13.
- Canonical bodies remain consumer-runtime self-contained (phase-1 decision 1a).
- `pastiche/spec.md` substantive revisions remain deferred to Phase 8.1 (phase-2 spec §13).
