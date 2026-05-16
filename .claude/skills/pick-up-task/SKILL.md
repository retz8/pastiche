---
name: pick-up-task
description: Pick up the next task from `_dev/docs/TODO.md`, coordinating with parallel Claude Code sessions via `[WIP]` markers. Use when the user invokes `/pick-up-task` or asks to grab the next pastiche task.
---

# pick-up-task

Picks the next available task from `_dev/docs/TODO.md` while letting multiple parallel Claude Code sessions coordinate via inline `[WIP]` tags.

## Assumptions

- Run from the pastiche repo root.
- Tasks are numbered `**<phase>.<n>**` (e.g. `**1.3**`).
- A phase is "open" if it contains any unchecked task (`- [ ]`).
- Phase specs live at `docs/spec/phase-<i>-*.md`.

## Workflow

1. **Find the open phase.** Read `_dev/docs/TODO.md`. The open phase is the lowest-numbered phase that still has at least one `- [ ]` line.

2. **Check for a phase spec.** Glob `docs/spec/phase-<i>-*.md` where `<i>` is the open phase number.

   - **No match → phase needs grilling.** Tell the user: "Phase `<i>` has no spec at `docs/spec/phase-<i>-*.md`. Run a phase-level grill-me first (per CLAUDE.md Rule 4)." Then invoke the `grill-me` skill, framing the grill around the phase's scope and shared decisions. After the grill, remind the user to save the locked decisions to `docs/spec/phase-<i>-<short-name>.md`. Stop.

   - **Match exists → pick a task.** Continue.

3. **List available tasks.** From the open phase, collect every line that is:
   - unchecked (`- [ ]`), AND
   - does **not** already contain `[WIP]`.

   Show the user the task numbers and one-line summaries. Ask which to pick up. If none available (all `[WIP]` or done), say so and stop.

4. **Claim the task.** Once the user picks one, use `Edit` to insert `[WIP] ` immediately after `- [ ] ` on that task's line. Example:

   - Before: `- [ ] **1.3** _dev/agents/...`
   - After:  `- [ ] [WIP] **1.3** _dev/agents/...`

   Use the full unique line as `old_string` to avoid mismatches.

5. **Hand off.** Report the claimed task number and remind the user which CLAUDE.md rule governs it:
   - "Author …" → Rule 2 (grill → spec at `docs/spec/<task-name>.md` → `write-a-skill`).
   - "Implement …" / "Port …" / others → Rule 3 (grill → `writing-plans` → `executing-plans`).

   Do not start the work itself — `/pick-up-task` ends after the claim. The user drives the next step.

## Notes

- `[WIP]` is a soft lock. It only works if every parallel session uses this skill. Don't strip `[WIP]` from other sessions' picks.
- On task completion, the executor flips `- [ ]` → `- [x]` and removes the `[WIP]` tag.
- If the user abandons a picked task, they should manually remove `[WIP]` so it returns to the pool.
