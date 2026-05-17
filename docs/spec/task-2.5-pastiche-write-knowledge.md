# Task 2.5 — `pastiche-write-knowledge` skill

Spec for authoring `skills/pastiche-write-knowledge.md` per OSS_SPEC §7.3 and Phase 2 spec §12. Inherits from `docs/spec/phase-2-templates-and-skills.md`.

## Scope

Author the canonical body of the `pastiche-write-knowledge` skill — one in-session, no-subagent skill that inserts a single scenario → atom(s) mapping into the appropriate H2 section of `pastiche/KNOWLEDGE.md`. Triggered free-form, or by a `knowledge-gap` follow-up emitted by the `pastiche` skill's gating loop.

## Locked decisions

### 1. Brand Identity out of scope

The skill handles only scenario → atom mappings. If invoked against `## Brand Identity`, it refuses and redirects the user to hand-edit `pastiche/KNOWLEDGE.md` directly, or to run `pastiche-setup --section brand-identity`. Brand Identity is prose, not a `→` mapping; its authoring surface belongs to `pastiche-setup`.

### 2. One scenario per invocation

Each invocation inserts exactly one scenario. Multi-`→` lines within that single scenario are allowed (per Phase 2 spec §4). To add multiple scenarios, re-invoke. Bulk section authoring belongs to `pastiche-setup --section <name>`.

### 3. Section identification — user-declared wins; otherwise propose + confirm

If the invocation names a target section, the skill takes it (verified spelling against the section list with case-insensitive / near-match fallback). Otherwise the skill proposes the best-fit section based on the scenario text and asks the user to confirm or override. The candidate space is the 11 non-Brand-Identity H2 sections.

### 4. Inline FACT verification of backticked identifiers, dual-surface

Every backticked identifier on a drafted `→` line is verified against `pastiche/FACT.md` before insertion, across both surfaces — components (YAML top-level keys under `## Components`) and tokens (flat lines under `## Tokens`). On miss, the skill attempts near-match (case-insensitive / typo) and surfaces the closest match for confirmation. On no match, it halts with the same shape of message `pastiche-write-wisdom` uses for unknown tags (misspelled / FACT stale / atom doesn't exist).

### 5. Show full chosen section before drafting

After the section is locked, the skill reads the section by line range (from `## <Section>` to the next `## `) and displays existing scenarios to the user, so they can self-detect duplication or refinement opportunities before drafting. Empty sections (only the `_(empty — …)_` marker) are shown as-is with a note that no neighbors exist.

### 6. Insertion appends to end of section; empty-marker is replaced

The new scenario is inserted at the end of the chosen section (immediately before the next `## ` heading). If the section's sole content is the `_(empty — run /pastiche-setup --section <name>)_` marker, the marker line is replaced by the new scenario rather than left above it.

### 7. Adaptive draft cadence

The skill drafts directly when the available context (invocation text, prior conversation, knowledge-gap follow-up payload) contains both scenario phrasing and at least one atom expression. When either is missing, the skill prompts for the missing piece(s) only. After drafting, it shows the exact lines as they will appear in the file and loops on `yes / edit` until confirmed.

### 8. Lint at end — mirror `pastiche-write-wisdom`

After insertion, the skill runs `pastiche lint`. On failure, it prints the lint output verbatim and stops — it does not revert the insertion. On success, it reports the insertion line and suggests re-invocation for additional scenarios. Same shape of behavior as `pastiche-write-wisdom`'s closing step.

## Invariants

- Canonical body is consumer-runtime self-contained (Phase 1 decision 1a). The skill body must not reference pastiche-internal docs (`spec.md`, OSS_SPEC, phase specs, etc.).
- No KISA atoms, paths, or phrasing.
- Skill body wording stays concise — written from the consumer-project perspective, not this repo's perspective.
