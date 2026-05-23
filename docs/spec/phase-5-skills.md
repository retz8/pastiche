# Phase 5 — Plugin slash-command skills

Phase-level spec for Phase 5 of `_dev/docs/TODO.md`, restructured after the plugin-first pivot locked in Phase 4 (`docs/spec/phase-4-scripts.md`). Phase 5 authors the slash-command skills that replace the original CLI surface and amends the existing mutator skills to invoke lint internally.

## Scope

Phase 5 covers four tasks:

- **5.1** Author `skills/pastiche-init.md`.
- **5.2** Author `skills/pastiche-sync.md`.
- **5.3** Author `skills/pastiche-lint.md`.
- **5.4** Amend `skills/pastiche-setup.md`, `skills/pastiche-write-knowledge.md`, and `skills/pastiche-write-wisdom.md` to invoke the bundled lint script internally.

Per CLAUDE.md Rule 2, each authoring task gets its own per-task spec at `docs/spec/<task-name>.md` and is executed with the `write-a-skill` skill.

## Locked decisions

### 1. Phase 5 restructure

The original Phase 5 task list ("CLI") is dropped or relocated under plugin-first distribution. Old 5.1 (CLI bootstrap) and old 5.2 (adapter generator) are dropped — both surfaces are eliminated by Phase 4 decisions 1, 2, and 6. Old 5.3 (pluggable extractor contract doc at `docs/contributing/adding-an-extractor.md`) moves to Phase 7 and merges with existing 7.5 as a single doc deliverable. Phase 5 is renamed from "CLI" to "Plugin slash-command skills."

### 2. No lint hook

Phase 4 open item 2 (lint-as-Claude-Code-hook) is killed, not relocated. Lint validates the three pastiche docs (FACT/KNOWLEDGE/WISDOM); the main `pastiche` skill loop produces app code and does not mutate those docs; a `PostToolUse` hook on Write/Edit would fire on every frontend file edit and lint docs that did not change. The only mutators of the three docs are the four skills listed in this phase (plus a human hand-editing), so lint runs from inside those skills and manually via `/pastiche-lint`. No hook is shipped.

### 3. `/pastiche-init` and `/pastiche-setup` are strictly separate

Init scaffolds `pastiche/{config.yaml, FACT.md, KNOWLEDGE.md (template), WISDOM.md (template)}` and stops. Init does not chain into setup. Curation (`/pastiche-setup`) is a deliberate, multi-session user action the adopter starts when ready. Init's closing message points the adopter at `/pastiche-setup` but does not auto-invoke it.

### 4. `/pastiche-sync` scope = FACT-only

Sync re-runs the extractor, overwrites `pastiche/FACT.md`, runs lint as a self-check, and reports drift. Sync does not walk the adopter through remediation; lint surfaces drift (orphaned atom tags, etc.) and the adopter consciously picks the right remediation tool (`/pastiche-write-wisdom`, hand-edit, etc.). Sync must stay cheap, idempotent, and predictable; bundling remediation would overlap `/pastiche-setup` and make sync's runtime unpredictable.

### 5. `/pastiche-init` does not call lint

Lint at init is a no-op: the KNOWLEDGE template includes the 12 canonical sections by construction, the WISDOM template has no atom tags yet, and FACT is fresh extractor output. There are no possible violations to surface.

### 6. Lint invocation contract (shared across the four caller skills)

Sync, setup, write-knowledge, and write-wisdom all invoke lint under the same contract:

- **Failure handling:** fail-warn, not fail-closed. Callers surface lint violations to the user; the skill body's own logic decides remediation (re-prompt the model, ask the user, etc.). Fail-closed does not fit skills that just wrote the file they are linting.
- **Output format:** plain text. Lint output is already human-readable; JSON adds friction for no gain.
- **Auto-fix:** none. Lint stays a pure reporter. Per-caller remediation logic is decided in each per-task grill, not at the phase level.
- **Invocation target:** caller skills invoke the lint script directly via `node $CLAUDE_PLUGIN_ROOT/dist/lint.js`, not the `/pastiche-lint` skill. Skills do not orchestrate other skills.

### 7. Task ordering

No internal dependencies inside Phase 5; all four tasks parallelize freely. External dependencies (`dist/extract-fact.js` from Phase 4.1 and `dist/lint.js` from Phase 4.2) are both done. Phase 6 (reference adoption) blocks on Phase 5 completion since it runs `/pastiche-init` against primer-react.

## Invariants

- The `/pastiche-lint` skill from 5.3 wraps the same `dist/lint.js` binary the other four skills invoke directly; it is the manual entry point for the hand-edit case.
- Phase 5 inherits Phase 4's plugin-first decisions (especially decisions 1, 2, and 6 in `docs/spec/phase-4-scripts.md`).
