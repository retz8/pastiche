# Phase 2 — Templates + skills that depend on them

Phase spec for Phase 2 of `_dev/docs/TODO.md`. Locks the decisions shared across every Phase 2 task. Per-task grillings inherit from this spec.

The phase scope expanded beyond mechanical generalization: it re-thinks the shape of the three documents, the agents' output formats, and one workflow architectural item (typecheck reporting). Task 2.6 (`pastiche-write-wisdom`) was shipped pre-2.3; its retrofit is covered by 2.8.

## Scope

- 2.1–2.3 — generalize `templates/{FACT,KNOWLEDGE,WISDOM}.md` per the new shapes locked here.
- 2.4 — author `templates/pastiche.config.yaml` per OSS_SPEC §9.4.
- 2.5, 2.7 — author `skills/pastiche-write-knowledge.md` and `skills/pastiche-setup.md`.
- 2.8 — sweep Phase 1 canonical bodies (`agents/pastiche-implementer-round1.md`, `agents/pastiche-implementer-round2.md`, `agents/pastiche-reviewer.md`, `skills/pastiche.md`) plus the pre-shipped `skills/pastiche-write-wisdom.md` for drift against the new formats and grep anchors locked here.

## Locked decisions

### 1. Per-document design priorities

Each document is optimized against its primary consumer set:

- **FACT** — machine-only (auto-extracted; reviewer reads in full, implementers grep). Optimize **token-efficient + grep-friendly**. Human readability is tertiary.
- **KNOWLEDGE** — dual-audience. Humans author/edit during setup and incremental write-knowledge invocations; implementer lazy-reads by H2 section; reviewer does not read it. Optimize **dual human-readable + agent-greppable**.
- **WISDOM** — human-readable (maintained by dev / designer / PM) AND agent-greppable by tag. Optimize **lazy-load by tag + readable as a flat bullet list**.

Tiebreaker when token efficiency and human readability conflict: favor human readability on KNOWLEDGE; favor token efficiency on FACT and WISDOM.

### 2. Substrate: all three docs remain `.md`

For promotion ("three markdown files are enough to represent a Design System"), all three docs keep the `.md` extension. Internal shapes vary: FACT embeds a YAML block; KNOWLEDGE and WISDOM stay pure markdown.

### 3. FACT shape (task 2.1)

`templates/FACT.md` structure:

- Top-of-file generator banner (HTML comment).
- `## Components` — fenced YAML block. Each atom is a top-level YAML key.
  - `pkg:` — source package name.
  - `spreads:` — list of `...spread` extension types when applicable.
  - Props as direct children of the atom key (no nested `props:` block). Required by default; `?` suffix marks optional.
  - Enum unions as YAML flow arrays of bareword values: `variant?: [primary, secondary]`.
  - Function-type props as quoted strings: `onChange?: "(v: string) => void"`.
  - `bool` (not `boolean`); `ReactNode` (not `React.ReactNode`).
  - Discriminated unions → `variants:` list of prop-map records.
  - Atoms with no props collapse to one-line flow: `Atom: { pkg: "..." }`.
- `## Tokens` — flat lines, one token per line, **no bullet prefix**.

Illustrative shape (full template authored in 2.1):

```md
## Components

\`\`\`yaml
Button:
  pkg: "@org/x"
  spreads: [ButtonHTMLAttributes<HTMLButtonElement>]
  size?: [sm, md, lg]
  variant?: [primary, secondary, tertiary, destructive]
\`\`\`

## Tokens
--color-primary
--color-surface
```

Grep contract changes (consumed by 2.8):

- Implementer atom-prop anchor moves from `^### \[Atom\]` to `^Atom:`.
- Alternation example: `grep -nE -A 20 '^(Atom1|Atom2):' pastiche/FACT.md`.

The extractor (Phase 4.1) emits the new shape. ~25% token reduction validated on a 10-atom KISA-derived sample.

### 4. KNOWLEDGE shape (task 2.2)

`templates/KNOWLEDGE.md` structure:

- Single top-of-file format-hint HTML comment (no per-section duplication).
- 12 H2 sections per OSS_SPEC §9.2 / philosophical §3.2. **No `## Index`** (phase-1 decision 1c remains in force).
- Each non-Brand-Identity section is a list of free-form scenarios under the H2. Each scenario is:
  - One or more lines of prose framing.
  - One or more `→ <atom expression>` lines.
- **Multi-`→` scenarios allowed.** No required blank-line separator between scenarios; the LLM parses boundaries semantically.
- **No H3 anchors per scenario.** The implementer reads the whole section by line range; H3 served no agent contract.
- **Atom names backticked (D1-lite); prop expressions bare.** Example: `` → `Button` variant="primary" ``. Lint extracts identifiers inside backticks on `→` lines and validates them against FACT (naming-convention agnostic — works for PascalCase components like `` `Button` ``, kebab-case tokens like `` `gap-4` ``, namespaced like `` `Form.Input` ``). Lint behavior is implemented in Phase 4.2.
- Empty sections ship with a marker line: `_(empty — run /pastiche-setup --section <kebab-name>)_`.
- Brand Identity is the final H2; prose, not bullets; always-loaded (see locked decision 7).

Illustrative scenario shape:

```md
## Action buttons
Submit a form, confirm a modal, advance a flow. The dominant action on the surface.
→ `Button` variant="primary"
Cancel, "Back", alternative path alongside a primary.
→ `Button` variant="secondary"
```

Grep contract unchanged (only the scenario sub-structure changed):

- `awk '/^## Brand Identity$/,0' pastiche/KNOWLEDGE.md` — always-load.
- `grep -n '^## ' pastiche/KNOWLEDGE.md | grep -v '## Brand Identity'` — enumerate the other 11.
- Read selected sections by line range.

### 5. WISDOM shape (task 2.3)

`templates/WISDOM.md` structure:

- Header HTML comment block.
- Commented-out `[GENERAL]` suggestions per OSS_SPEC §9.3.
- Flat bullet list. Each bullet: `- [Tag1,Tag2,Tag3] rule text.`
- **Comma-in-bracket tag list** (replaces phase-1's `[A][B][C]` concatenated brackets). `[GENERAL]` is itself a tag.
- **Loose cluster ordering** preserved: writer inserts after the last line matching any of the new entry's tags; if no tag matches, append to end of file.

Grep contract changes (consumed by 2.8):

- Round-1 / reviewer alternation grep: `grep -nE '^- \[[^]]*\b(GENERAL|Atom1|Atom2)\b' pastiche/WISDOM.md`.
- Round-2 new-atom delta grep: same shape with new atom set.
- `pastiche-write-wisdom`'s neighbor scan: `grep -nE '^- \[[^]]*\bAtom\b' pastiche/WISDOM.md`.

### 6. Workflow: reviewer's FACT read stays full

The reviewer's "Read `pastiche/FACT.md` in full" step is **load-bearing, not redundant**. Hallucination judgment requires priming with the DS's full atom set; valid code legitimately uses identifiers outside FACT (project-local composite components built from atoms; default Tailwind utilities outside the DS's curated tokens). Lazy alternation-grep cannot reliably distinguish these from hallucinations.

Round-1 and round-2 continue to grep FACT lazily as today; only the grep anchor changes per locked decision 3.

### 7. Workflow: Brand Identity remains always-loaded

Round-1 always reads `## Brand Identity` in full as today. Conditional loading is rejected — Brand Identity is a foundational invariant per philosophical spec §3.2; trading it for token savings on "trivial" tasks would silently degrade DS faithfulness.

### 8. Workflow: typecheck retained, reporting dropped

Per phase-1 decision 1d, both implementer rounds run `typecheck_command` from `pastiche.config.yaml` after writing/correcting code, and patch errors using the compiler's error message (bounded 3 attempts per error). **This execution stays.** Observability drops:

- Round-1 output no longer includes a typecheck line.
- Round-2 output likewise drops the typecheck line and the "surface remaining errors in the report" clause.
- `pastiche.config.yaml` retains the `typecheck_command` field (the implementers still read it).
- If typecheck FAILED after 3 attempts, the code ships with the error; the user catches it via their own typecheck. No orchestrator follow-up.

Rationale: the reporting was theatrical (no preserved surface to act on it; users run their own typecheck), but the in-loop patching catches real correctness issues before ship. Phase-1 decision 1d is partially overridden.

### 9. Reviewer body step 3 — judgment-based semantics (2.8 sweep)

The current reviewer body step 3 reads as a strict whitelist test ("If absent, the implementer hallucinated it — raise a doubt"). This is too strict — valid code uses non-FACT identifiers (project-local composites, default Tailwind utilities, etc.). The 2.8 sweep rewrites step 3 to judgment-based semantics: raise a doubt only when the identifier reads as a *would-be* DS atom (typo of a FACT name, or a fabrication shaped like one).

### 10. Agent output formats

All three internal agent outputs adopt compact non-markdown forms. The orchestrator's final human-facing response (`## Summary` / `## Follow-ups`) stays markdown.

#### 10a. Reviewer output — O4 pipe-per-record

```
src/foo.tsx#42 | Raw <button> here; FACT has Button.
src/bar.tsx#88 | Token #1a73e8 should reference --color-brand-primary.
```

- One doubt per line: `<path>#<line> | <comment>`.
- Empty case: literal `(no doubts)`.
- Orchestrator's "malformed output" path stays; trigger updates to "any line not matching `<path>#<line> | <comment>` (and output isn't `(no doubts)`)."

#### 10b. Round-1 output — compact key:value, three lines

```
files: src/foo.tsx, src/bar.tsx, src/baz.tsx
atoms: Button, Card, Avatar
gaps: Refund destructive confirmation with cooldown timer
```

- `files:` — comma-separated paths, or `-` if none.
- `atoms:` — comma-separated atom names used in changed code, or `-`.
- `gaps:` — comma-separated knowledge-gap scenario descriptions (term stays terse; round-1 detects knowledge-gaps only), or `-`.
- No typecheck line.

#### 10c. Round-2 output — compact key:value + record blocks

```
files: src/app/dashboard/page.tsx, src/app/dashboard/widget.tsx
defended:
  src/app/dashboard/widget.tsx#42 (knowledge-gap) | Used Card directly per dashboard convention; no FormItem mapping exists for non-form summary tiles
  src/app/dashboard/widget.tsx#88 | The Badge here is informational, not status; default variant is intentional
unresolved:
  src/app/dashboard/page.tsx#15 | Raw <button> for "View all" link could use LinkButton
```

- `files:` — same shape as round-1; `-` if none.
- `defended:` — block of records: `<path>#<line> (<gap-tag>) | <reason>`. **Parentheses omitted entirely** when no gap-tag. Tags: `knowledge-gap` or `wisdom-gap`. Empty block: inline `defended: -`.
- `unresolved:` — block of records: `<path>#<line> | <comment>`. Empty block: inline `unresolved: -`.
- No typecheck line.

#### 10d. Gap detection and reporting responsibilities

- **knowledge-gap** is detected by round-1 (implementation-blocking — surfaces in `gaps:`) and by round-2 (defense-time — surfaces as `(knowledge-gap)` tag in `defended:`).
- **wisdom-gap** is detected only by round-2 (defense-time — surfaces as `(wisdom-gap)` tag in `defended:`).
- The reviewer detects neither; it only raises doubts. Tagging is the implementer's call.
- Orchestrator's final `## Follow-ups` cites docs explicitly: each `(knowledge-gap)` becomes a `KNOWLEDGE.md — <scenario>` follow-up; each `(wisdom-gap)` becomes a `WISDOM.md — <observation>` follow-up; each `unresolved:` record becomes a `<path>#<line> — <comment>` follow-up.

### 11. `pastiche.config.yaml` (task 2.4)

Schema follows OSS_SPEC §9.4 unchanged. `typecheck_command` retained per locked decision 8. Phase-level confirmation only; no schema changes here.

### 12. Skills (tasks 2.5, 2.7) — phase-level inheritance

- Both skills are in-session, no subagent dispatch (inherited from phase-1 spec decision 3).
- Both interact with the formats locked here:
  - `pastiche-write-knowledge` produces backticked-atom-name `→` lines per locked decision 4.
  - `pastiche-setup` reads FACT to apply correct backticking during the KNOWLEDGE walk, and reads the new `gaps:`/`defended:` shapes if it surfaces follow-ups from prior loop runs.
- Both authored with the `write-a-skill` skill per CLAUDE.md Rule 2.
- Per-task scope, workflow steps, frontmatter, and trigger surfaces are decided in each task's own per-task grill + spec.

### 13. 2.8 retrofit scope

Task 2.8 sweeps the Phase 1 canonical bodies and one orchestrator skill against the decisions locked here:

- `agents/pastiche-implementer-round1.md` — new FACT grep anchor (`^Atom:`), new round-1 output format (10b), drop typecheck reporting (8), WISDOM `[A,B,C]` comma-tag grep (5), hard-constraint paragraph review (drop the "Do not grep FACT while patching" clause's report-this scope).
- `agents/pastiche-implementer-round2.md` — same set, plus new round-2 output format (10c) and removal of "surface unresolved typecheck errors in the report" language.
- `agents/pastiche-reviewer.md` — step 3 rewrite to judgment-based semantics (9), new reviewer output format (10a), WISDOM tag grep update.
- `skills/pastiche.md` — orchestrator parse logic for all three new output formats; final `## Follow-ups` composition per 10d; reviewer empty-case sentinel handling.
- `skills/pastiche-write-wisdom.md` (already shipped pre-2.3) — WISDOM `[A,B,C]` comma format; FACT grep anchor update where applicable.

`pastiche/spec.md` substantive revisions are deferred to Phase 8.1; 2.8 sweeps agent/skill bodies only.

## Invariants

- Each decision above either re-affirms or revises a specific OSS_SPEC §9 / §14 item, or extends/overrides a phase-1 decision; nothing is invented outside this trail.
- Phase-1 decisions stay in force except where this spec explicitly overrides — 1b unchanged, 1c unchanged, 1d partially overridden per locked decision 8.
- Canonical bodies remain consumer-runtime self-contained (phase-1 decision 1a).
- No KISA in canonical files (phase-1 decision 2).

## Per-task specs

Each Phase 2 task whose decisions go beyond this phase spec writes its own per-task spec at `docs/spec/<task-name>.md` (kebab-case), produced after a per-task `grill-me` session. Per-task specs inherit from this phase spec.
