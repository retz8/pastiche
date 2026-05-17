# Task 2.6 — Revisit `skills/pastiche-write-wisdom.md` against finalized WISDOM template

Revisit task 2.6 against the WISDOM.md template locked in task 2.3. The skill was authored before the template finalized, so several elements of its body drift from the locked template shape. This spec captures the edits to apply.

## Scope

- Edits to `skills/pastiche-write-wisdom.md` only.
- Aligns the skill's framing, canonical bullet form, and grep-based neighbor/insertion logic with `templates/WISDOM.md`.
- No changes to other Phase 1/2 artifacts (those are covered by task 2.8).

## Locked decisions

### 1. Canonical bullet shape

The skill body adopts the comma-bracket form `- [Tag1,Tag2,...] rule text.` — one bracket pair, comma-separated tags. `[GENERAL]` is called out as the lone non-FACT tag, reserved for system-wide rules. The skill does not restate the format in detail; it defers to WISDOM.md's header comment as the source of truth.

### 2. Grep pattern for neighbor and insertion logic

The fixed-string grep is replaced with an extended-regex pattern that matches a tag as a whole token inside the bracket — bounded by `[`, `,`, or `]`. The skill notes that tag names containing regex meta-characters (e.g. `.`, `--color-…`) must be escaped before substitution. The pattern is pinned in the skill body for determinism.

### 3. Section-blind insertion

The skill does not parse or respect section dividers. The locked template has no section structure; the section dividers visible in `_dev/templates/WISDOM_umichkisa.example.md` are illustrative curation, not part of the canonical shape. Insertion remains "after the last matching line across the entry's tags; else append to EOF."

### 4. Post-setup file assumption

The skill assumes WISDOM.md is in its post-`pastiche-setup` state — i.e., the template's commented `[GENERAL]` suggestion block has already been resolved (uncommented or stripped) by setup. No special-case logic for that block lives in this skill.

### 5. HTML-comment filter on grep results

Grep results are filtered to exclude lines inside HTML comments, so the template's header comment (which contains the literal text `[GENERAL]` as part of its format-spec sentence) does not produce false positives in step 5's neighbor view or step 7's insertion-point computation.

### 6. Wordiness cleanup

Three cleanup edits with no semantic change:

- **A.** Collapse the opening paragraph (current line 8): drop the duplicated "one rule per invocation" phrasing and remove the restated format description; defer to WISDOM.md's header instead.
- **B.** Step 2: trim the two scenario-conditional counter-examples to one (or drop both — the qualifier-phrase rule above them is self-contained).
- **C.** Step 3: compress the three numbered causes in the "Tag not in FACT" error message into a single sentence.

The Step 4 `[GENERAL]` gate is preserved intact — its system-wide test is a safety net even though Step 2 nominally filters scenario-conditionals.

## Invariants

- The skill body never duplicates rules already stated in `templates/WISDOM.md`'s header. Where overlap is unavoidable (e.g. the bullet shape in step 6), the skill defers to the template as source of truth.
- Steps 1, 2 (test logic), 3 (FACT-verbatim verification), 4, and 8 are unchanged in substance.
