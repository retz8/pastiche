---
name: grill-to-spec
description: Convert a completed grill-me session into a spec file. Captures only the task and the decisions locked during grilling — no implementation details, no invented decisions. Use when the user asks to write a spec from a grill, save grill decisions, or after a grill-me session concludes.
---

# Grill to Spec

Convert a just-completed `grill-me` session into a spec file at the path specified by the user (typically `docs/spec/<task-name>.md` or `docs/spec/phase-<n>-<short-name>.md`).

## Hard rules

- **Spec, not plan.** Capture *what was decided*, not how to implement it. No task breakdown, no step-by-step, no file-by-file instructions.
- **Only what was locked in the grill.** If a decision did not come up explicitly in the grilling conversation, do not include it. Do not infer, do not extend, do not add "for completeness."
- **No invented decisions.** If the user did not state a preference on something, it is not in the spec. Surface it as an open item only if the user flagged it as open during grilling.
- **No implementation details.** No code, no command lines, no file syntax, no per-step procedure. The spec is a high-level overview of the locked task scope and decisions.

## Required structure

```md
# <Task title>

<One- or two-sentence statement of what this spec covers. Reference the parent TODO item, phase, or OSS_SPEC section.>

## Scope

<Bulleted or short-prose statement of what is in scope for this task. Drawn from the grill, not invented.>

## Locked decisions

### 1. <Decision title>

<One short paragraph stating the decision as locked in the grill.>

### 2. <Decision title>

<...>

## Invariants

<Optional. Constraints the grill surfaced that apply throughout the task. Skip if none were raised.>

## Open items

<Optional. Only items the user explicitly flagged as deferred or unresolved during the grill. Skip if none.>
```

## Process

1. Confirm with the user: target file path, and the scope of the grill session being converted (which task/phase).
2. Re-read the grilling conversation in context. Identify every decision the user explicitly accepted, rejected, or modified.
3. Draft the spec using the required structure above.
4. Show the draft to the user. Ask: *"Anything in here you did not lock during the grill? Anything missing that you did lock?"*
5. Revise on feedback. Write the final file.

## What this skill never does

- Decompose the task into sub-tasks or a plan.
- Specify file contents, command flags, or code shapes.
- Add "recommended next steps."
- Re-open decisions the grill closed.
- Add decisions the grill did not cover.
