# Task 1.8 — Author `skills/pastiche-write-wisdom.md`

Spec for the canonical body of the `pastiche-write-wisdom` skill. Covers `_dev/docs/TODO.md` task 1.8 and OSS_SPEC §7.4. Inherits Phase 1 spec (`docs/spec/phase-1-canonical-sources.md`).

## Scope

- Author the canonical, project-agnostic body of `skills/pastiche-write-wisdom.md`.
- The skill is conversational, in-session, single-rule-per-invocation; no subagent dispatch.
- Behavior covers both trigger surfaces: free-form user request to add/revise a WISDOM rule, and `wisdom-gap` follow-up triage emitted by `skills/pastiche.md`.

## Locked decisions

### 1. Session scope: one rule per invocation

Each invocation handles exactly one proposed WISDOM rule. The skill exits after the rule is inserted (or after a halt). Users triaging multiple `wisdom-gap` follow-ups invoke the skill in parallel.

### 2. No preflight

The skill does no setup-check before running. Preflight lives in the main `skills/pastiche.md` orchestrator; this authoring skill is small and is normally invoked downstream of an already-set-up project (free-form ask, or `wisdom-gap` follow-up triage). If FACT or WISDOM are missing, the workflow's own read/grep steps will surface the error.

### 3. Opening move

If a proposed rule is already on the table from the surrounding session, the skill uses it. Otherwise, it asks the user for the rule. It then reads `FACT.md` in full (bounded mechanical catalog).

### 4. Tag-not-in-FACT handling

When the user-provided tag is not found in FACT, the skill retries case-insensitively / for near-matches and surfaces the closest match for confirmation. If still no match, it halts with a message naming the three possible causes (misspelling, stale FACT requiring `pastiche sync`, atom genuinely absent — reconsider as KNOWLEDGE or `[GENERAL]`). No insertion happens; the user re-invokes after resolving.

### 5. Atom-intrinsic verification

The skill applies a single phrasing test: can the rule be stated as a property of the atom that holds everywhere the atom appears? If the rule contains a scenario qualifier (e.g., "in payment flows", "for destructive actions", "when used as primary CTA"), it is scenario-conditional and the skill halts with a redirect to `/pastiche-write-knowledge`. Two §3.3 counter-examples are inlined as anchors.

### 6. `[GENERAL]` gatekeeping

`[GENERAL]` is treated as a residual category gated by two tests: (a) tag-fit — can the rule be tagged to a specific atom or finite set of atoms drawn from FACT? (b) system-wide — does it hold for all UI in the project regardless of atoms used? Failure of either test halts with a redirect (back to atom-tagging or to KNOWLEDGE). `[GENERAL]` is only accepted when both tests pass and the user explicitly confirms.

### 7. Insertion location

WISDOM.md is a flat bulleted list; tag syntax is `[Atom1][Atom2] text` (concatenated brackets, no commas); `[GENERAL]` is itself a tag. For each tag in the new entry the skill greps WISDOM for existing matches and inserts the bullet after the last matching line (cluster tail). If no tag has any existing match, the entry is appended to end of file. `[GENERAL]` follows the same cluster rule.

### 8. Multi-tag entries

After the primary tag is locked, the skill scans FACT and proactively suggests additional candidate atoms the rule may apply to identically. The user picks which (if any) to add; each picked tag is spelling-verified per decision 4. At 5+ tags, the skill prompts the user to consider `[GENERAL]` and re-runs the decision-6 gate.

### 9. Duplicate detection

Before drafting, the skill shows the user existing WISDOM entries that share any of the chosen tags, so the user can self-detect duplication or refinement opportunities. The skill does not attempt semantic matching.

### 10. Read-back format

The skill shows the exact bullet line as it will appear in WISDOM.md and asks `yes / edit text`. Insertion location is not shown — it is mechanical per decision 7.

### 11. Lint handling

After insertion the skill runs `pastiche lint`. On pass: report success. On failure: surface lint output verbatim and stop. No auto-revert; the user can fix manually or re-invoke after `pastiche sync`.

### 12. Wisdom-gap follow-up entry path

No dedicated branch in the body. Decision 3's opening (use the proposed rule if it's already on the table) covers the follow-up triage case implicitly.

### 13. Skill frontmatter

`description`: *"Use when adding or revising an atom-intrinsic rule in WISDOM.md — including when triaging a `wisdom-gap` follow-up from the pastiche skill."* `allowed-tools` is omitted; the skill inherits harness defaults. (Frontmatter is identical across Claude Code and Codex per phase-1 spec decision 1.)

### 14. Closing message

On successful insertion + lint pass, the skill exits with a single line: `Inserted at WISDOM.md:<line>. Lint passed. Re-invoke for additional rules.`

## Invariants

- Canonical body is consumer-runtime self-contained per phase-1 spec §1a: no references to pastiche-internal docs, no phase numbers, no this-repo structure.
- WISDOM data format is flat bullets with concatenated-bracket tag syntax, as shown in the WISDOM template; the skill never introduces section headings or alternate tag forms.
- All halt conditions exit without modifying any file.
