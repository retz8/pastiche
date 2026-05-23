# Task 5.3 — `skills/pastiche-lint.md`

Per-task spec for Phase 5 task 5.3 of `_dev/docs/TODO.md`. Authors the `/pastiche-lint` slash-command skill: the manual entry point that wraps the bundled lint script for the hand-edit case. Inherits Phase 5 decisions from `docs/spec/phase-5-skills.md` (especially the lint invocation contract and the strict separation between `/pastiche-lint` and the four mutator skills that invoke lint internally).

## Scope

- Author one skill body at `skills/pastiche-lint.md`.
- The skill wraps the same bundled lint script the four mutator skills (sync, setup, write-knowledge, write-wisdom) invoke directly.
- The skill exists to serve the hand-edit case — when an adopter modifies FACT/KNOWLEDGE/WISDOM outside any mutator skill and wants to re-validate.

## Locked decisions

### 1. Thin body

The skill body is a thin wrapper: invoke the bundled lint script, then print its output verbatim. No interpretation of violations, no grouping by document, no remediation pointers to other skills, no chaining into mutator skills. The adopter reads the script's output directly.

Rationale: the phase spec frames `/pastiche-lint` as a "manual entry point" whose job is to surface, not to guide. Any remediation hints belong inside the lint script's own output, not in a wrapper skill.

### 2. Zero-arg surface

`/pastiche-lint` takes no arguments. It always lints all four documents from cwd. No pass-through flags, no curated subset selectors (e.g. `fact`-only / `wisdom`-only). The lint script itself accepts no flags today, so any argument surface would require expanding the script first — out of scope.

### 3. Trust cwd; no pre-flight

The skill body does not check for the existence of `pastiche/` or any of its files before invoking the lint script. The script's own sentinel checks emit a clear, adopter-facing message when `pastiche/config.yaml` (or any of the four docs) is missing, including the suggestion to run `/pastiche-init`. Duplicating that check in the skill body would edge the skill away from "thin."

### 4. Surface output verbatim

The skill body does not interpret the lint script's exit code, does not add a success/failure header, and does not reframe the outcome. The script's own summary already includes an `OK` / `FAILED — N violation(s)` line; the skill prints stdout and stderr as-is.

## Invariants

- Inherits the Phase 5 lint invocation contract (`docs/spec/phase-5-skills.md` decision 6): plain-text output, no auto-fix, no orchestration of other skills. `/pastiche-lint` is the manual sibling of the in-skill lint calls the four mutators perform — it wraps the same binary, not a different one.
- Stays consistent with the Phase 5 stance that skills do not orchestrate other skills: `/pastiche-lint` does not suggest, chain into, or invoke `/pastiche-write-wisdom`, `/pastiche-write-knowledge`, `/pastiche-setup`, or `/pastiche-sync`.
