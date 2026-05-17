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

### 4. FACT-rooted tags (Option A) — phase-2 §3/§4/§5 amendment

Discovered during 2.8 verification: the locked phase-2 §4 admitted derived Tailwind utility names (e.g. `text-foreground`, `gap-4`) as valid KNOWLEDGE backtick contents, while phase-2 §5 tagged WISDOM rules with the underlying CSS-var (`[--color-foreground]`). Round-1 read KNOWLEDGE utility-form atoms and greped WISDOM by those — silently missing every var-tagged rule. The KNOWLEDGE↔WISDOM bridge was broken end-to-end.

Locked solution: **FACT identifiers are the single canonical atom namespace.** KNOWLEDGE backticks and WISDOM tags use FACT entries verbatim — components (`Button`), namespaced components (`Form.Input`), CSS-var tokens (`--color-foreground`), dotted-class tokens (`.type-h1`). Derived Tailwind utility names (`text-foreground`, `bg-surface`) are not valid identifiers in either doc; the implementer derives them at code-write time from the underlying var. Untracked Tailwind utilities (`gap-*`, `rounded-*`) are not FACT entries and never appear in KNOWLEDGE; their conventions belong in WISDOM as `[GENERAL]` rules.

Phase-2 spec amended inline: §4 example reworded, §5 grep example replaced with bracket-delimited form (`^- \[([^]]*,)?(Tag)(,[^]]*)?\]`) to handle `--`-prefix and `.`-prefix tags that have no `\b` word boundary at the bracket start.

### 5. Propagation scope

The Option A enforcement sweep covers, in addition to the four bodies in §1's scope:

- `templates/KNOWLEDGE.md` — header format-hint rewritten.
- `skills/pastiche-write-knowledge.md` — one-liner addition; `gap-4` example dropped.
- `skills/pastiche-write-wisdom.md` — one-liner addition; grep already in bracket-delimited form (no further change).
- `_dev/templates/KNOWLEDGE_umichkisa.example.md` — all utility-form backticks rewritten to FACT IDs; `gap-*` and `rounded-*` scenarios deleted (their conventions move to WISDOM).
- `_dev/templates/WISDOM_umichkisa.example.md` — `[GENERAL]` rounded-* convention rule added (`gap-*` rule already present).

## Invariants

- All retrofit moves enumerated in `docs/spec/phase-2-templates-and-skills.md` §13 for the four files in scope apply. This spec adds three resolutions on top; it does not override §13.
- Canonical bodies remain consumer-runtime self-contained (phase-1 decision 1a).
- `pastiche/spec.md` substantive revisions remain deferred to Phase 8.1 (phase-2 spec §13).
