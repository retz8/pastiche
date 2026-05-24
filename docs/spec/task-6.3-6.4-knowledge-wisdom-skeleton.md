# Tasks 6.3 + 6.4 — KNOWLEDGE and WISDOM skeleton passes

Spec for filling the Primer reference adoption's KNOWLEDGE.md (scenario→atom mappings) and WISDOM.md (atom-tagged rules), distilled from the research doc at `examples/github-primer-react/docs/primer-research.md`. Combined spec because the two tasks share source material and execution approach.

## Scope

- Fill all 11 scenario sections of KNOWLEDGE.md with 1–3 entries each (target 2), plus Brand Identity prose.
- Seed WISDOM.md with `[GENERAL]` system-wide rules and 5 atom-tagged rules.
- Lint must pass after both passes are complete.

## Locked decisions

### 1. Skill split

Setup skill handles Brand Identity prose and `[GENERAL]` WISDOM (its canonical seeds — tokens-only, spacing discipline, breakpoint discipline, accessibility floors — are well-suited). All 11 scenario sections are filled via write-knowledge. Additional atom-tagged WISDOM rules are added via write-wisdom.

### 2. User-driven execution

The user runs all skills manually. The deliverable from this task is a copy-pasteable reference doc organized by skill invocation order, not direct file edits.

### 3. Skeleton depth

1–3 scenario→atom entries per KNOWLEDGE section (target 2). Thin sections (e.g., Date & time selection) may have 1. This is a skeleton — deeper entries come JIT during task 6.5 pastiche invocations.

### 4. WISDOM count

5 atom-tagged rules beyond the `[GENERAL]` set. All must be atom-intrinsic (hold everywhere the atom appears, no scenario qualifier).

### 5. Reference doc structure

Organized by skill invocation order: Brand Identity prose (for setup) → `[GENERAL]` WISDOM notes (for setup) → 11 KNOWLEDGE sections (for write-knowledge, one invocation per scenario) → 5 atom-tagged WISDOM rules (for write-wisdom, one invocation per rule). Each block labeled with which skill to invoke and what to paste.

### 6. Optimistic atom names

Scenarios and rules use component/token names from the research doc (e.g., `Button`, `Dialog`, `ActionList`). The write-knowledge and write-wisdom skills verify each atom against FACT.md at runtime and flag mismatches for on-the-spot correction.
