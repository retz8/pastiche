# Task 5.4 — Amend mutator skills to invoke the lint script directly

Spec for TODO task 5.4: amend `skills/pastiche-setup.md`, `skills/pastiche-write-knowledge.md`, and `skills/pastiche-write-wisdom.md` so each invokes the bundled lint script directly at the end of every mutation, in place of orchestrating the `/pastiche-lint` skill. Inherits from `docs/spec/phase-5-skills.md` (decision 6 — lint invocation contract: fail-warn, plain text, no auto-fix, direct script invocation).

## Scope

In-place amendment of three existing skill bodies. No new files. The change replaces every `Run /pastiche-lint` call site with a uniform inline lint-script invocation; tightens the closing line of the two write skills to handle fail-warn; and drops one redundant aggregation step from setup's wrap.

## Locked decisions

### 1. Uniform inline replacement of every lint call site

Every site that currently says "Run `/pastiche-lint`" across the three skills is replaced with the same canonical lint-step text. The contract is identical at every site; uniform phrasing prevents drift across nearly-identical mutation flows. The replacement text:

> Run `node $CLAUDE_PLUGIN_ROOT/dist/lint.js` with cwd = repo root. Forward stdout (summary) verbatim. If exit is non-zero, also forward stderr (violations) verbatim. Do not revert the insertion. Do not abort the skill.

Applies to: write-knowledge step 6, write-wisdom step 8, setup's Brand Identity step, setup's scenario-section step 5, and setup's `[GENERAL]` WISDOM phase step 3.

### 2. Drop setup's aggregated lint summary at wrap

Setup's Wrap step currently includes a "Lint summary — only if any section had an unfixed lint failure during the walk; list those sections. Otherwise skip." This item is removed entirely. The per-section inline lint output from decision 1 already shows the user every failure as it occurs; aggregating at wrap re-lists what the user has already seen and would force setup to track per-section lint state across the whole walk. Wrap's remaining items (completion line, light stats, single concrete next step) stay as-is.

### 3. No crash vs. violations classification in the mutator skills

Unlike `/pastiche-sync` (task 5.2 decision 4), the mutator skills do not branch on whether the lint script crashed vs. found violations. They forward stdout + stderr verbatim regardless. Mutator skills act on a single insertion within a tight user-facing loop; a lint script crash in that context is loud and unambiguous to the user without skill-body labeling. Classifying would also split decision 1's uniform replacement text back into per-site logic.

### 4. Two-variant closing line for write-knowledge and write-wisdom

Both skills currently end with a single "Inserted at … Lint passed. Re-invoke …" line that assumed fail-closed lint. Under fail-warn (no abort on non-zero), the closing must handle both outcomes:

- **Clean (lint exit 0):** *"Inserted at `<file>:<line>`. Lint passed. Re-invoke for additional `<scenarios|rules>`."*
- **Not-clean (lint exit non-zero):** *"Inserted at `<file>:<line>`. Lint output above — review and remediate. Re-invoke for additional `<scenarios|rules>`."*

The clean variant preserves the existing reassuring "Lint passed" signal; the not-clean variant tells the user explicitly to act on what was printed above.

### 5. Setup's per-section close is unchanged

Each section's lint output prints inline (per decision 1) and the cadence prompt that follows ("Section `<name>` done. Continue / switch / pause?") stays as currently written. No lint-status branch is added to the cadence prompt; the user has already seen the inline output above.

## Invariants

- Per-section state tracking (which sections passed/failed lint during a setup walk) is explicitly avoided by decisions 2 and 3.
- No skill in this set orchestrates another skill; lint is invoked exclusively as a Node subprocess via `$CLAUDE_PLUGIN_ROOT/dist/lint.js`.
