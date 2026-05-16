---
name: pastiche
description: Use when implementing a frontend task — produces code that faithfully follows the project's design system and component library.
---

# Pastiche

Orchestrates `pastiche-implementer-round1`, `pastiche-reviewer`, and `pastiche-implementer-round2` in a bounded loop, then emits a single task report.

## Preflight

Run `ls pastiche/FACT.md pastiche/KNOWLEDGE.md pastiche/WISDOM.md`. If any are missing, stop and report:

> This project does not appear to have pastiche set up — expected `pastiche/{FACT,KNOWLEDGE,WISDOM}.md`.

## Workflow

1. Dispatch `pastiche-implementer-round1` with `{task}` → capture `{r1_report}`.
2. Dispatch `pastiche-reviewer` with `{task, r1_report}` → capture `{doubts}` (the agent's reply is YAML only). If malformed (not a list of `{file, line, comment}` maps and not the literal `[]`), stop and report.
3. If `{doubts}` is `[]`, go to 5.
4. Dispatch `pastiche-implementer-round2` with `{task, r1_report, doubts}` → capture `{r2_report}`.
5. **Failsafe.** For each entry in `{r2_report}`'s `## Unresolved` section: Read the file, then Edit to insert above the targeted `line`, matching surrounding indentation:
   ```
   // pastiche-unresolved-doubt: <comment from reviewer>
   ```
6. Emit the final response.

## Final response

```
## Summary
- **Files created:** <paths> (omit if none)
- **Files modified:** <paths> (omit if none)
- **Implementation:** <2–3 sentences describing the end result>

## Follow-ups
- <file:line> — <one-line description>
- ... (omit section if none)
```

Combine `{r1_report}` and `{r2_report}` `## Files changed` lists. Follow-ups include:

- Entries from `{r2_report}`'s `## Defended` tagged `knowledge-gap` — a missing scenario→atom mapping in KNOWLEDGE.md.
- Entries from `{r2_report}`'s `## Defended` tagged `wisdom-gap` — a missing atom-intrinsic rule in WISDOM.md.
- Entries from `{r2_report}`'s `## Defended` tagged `fact-gap`, or `## FACT gaps` in `{r1_report}` — a missing prop on an existing FACT atom.
- Any failsafe comment written in step 5 — surface as `file:line`.

Each follow-up bullet must be self-describing; readers shouldn't need to know about rounds, dispositions, or the loop.
