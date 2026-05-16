# Task 1.3 — Port `pastiche-implementer-round2`

Per-task spec for TODO item **1.3**: port `_dev/agents/pastiche-implementer-round2.md` → `agents/pastiche-implementer-round2.md` + `agents/pastiche-implementer-round2.claude-code.meta.yaml` + `agents/pastiche-implementer-round2.codex.meta.yaml` sidecars. Inherits all phase-wide decisions from [`docs/spec/phase-1-canonical-sources.md`](./phase-1-canonical-sources.md).

## Scope

- Produce canonical agent body at `agents/pastiche-implementer-round2.md` (markdown, no frontmatter).
- Produce per-platform sidecars at `agents/pastiche-implementer-round2.claude-code.meta.yaml` and `agents/pastiche-implementer-round2.codex.meta.yaml`.
- Delete `_dev/agents/pastiche-implementer-round2.md` after the port (Rule 5 discipline).
- Out-of-band during this task: patch `agents/pastiche-implementer-round1.md` to adopt the rewritten hard-constraint paragraph (decision 7), and amend `docs/spec/phase-1-canonical-sources.md` with the new phase-level decision recording that rewrite.

## Locked decisions

### 1. Sidecar — Claude Code

- `name: pastiche-implementer-round2`
- `description: Resolves design-system doubts on existing frontend code against the project's KNOWLEDGE.md and WISDOM.md.`
- `model: sonnet` — round-2 is doubt-by-doubt local reasoning, lighter cognitive load than round-1's whole-task planning; matches the source body's declared model.
- `tools: [Read, Edit, Write, Bash, Glob]`

### 2. Sidecar — Codex (placeholder per phase decision 1f)

- `name: pastiche-implementer-round2`
- `description: Resolves design-system doubts on existing frontend code against the project's KNOWLEDGE.md and WISDOM.md.`
- `model: gpt-5-codex`
- `sandbox_mode: workspace-write` — round-2 writes files for `corrected` dispositions and during typecheck patching.

`name` and `description` are identical across both sidecars (drift-prevention). The description omits any "Pastiche round-2 …" preamble. Codex sidecar carries a banner comment marking it unverified, mirroring the round-1 sidecar.

### 3. Opening voice retained verbatim

The "You are a senior frontend engineer …" opener stays as written. Research confirmed Anthropic's Opus 4.7 guidance still explicitly recommends role priming; no "research-then-execute" replacement is endorsed. This decision applies symmetrically to round-1, round-2, and the reviewer (1.4).

### 4. FACT-gap removal mechanics

Per phase decision 1b, all `fact-gap` references are stripped:

- The `fact-gap` bullet is removed from the Defended gap-tag list.
- The hard-constraint sentence *"If a correction would need a prop FACT lacks, defend with `fact-gap` rather than source-diving."* is dropped entirely with no replacement — mirroring round-1's post-1b posture. The general defend logic and the typecheck step absorb the cases that sentence used to cover.

### 5. Typecheck step

A new workflow step runs after all doubt dispositions are processed:

- Always run, regardless of whether any `corrected` disposition touched files. Defended-only rounds still typecheck — round-2 is the last chance to surface compiler-level breakage round-1's typecheck may have left behind.
- Source: `typecheck_command` field in `pastiche.config.yaml`. If null or absent, skip the step (report's `## Typecheck` line reads `skipped`).
- For each error returned, patch the code using the compiler error message as ground truth. Bounded to 3 patch attempts per failing error. After the bound, list remaining errors verbatim in the report.
- Hard-constraint extension: **"Do not grep FACT while patching."** Same as round-1.

### 6. Report skeleton

```
## Files changed
## Typecheck
## Defended
## Unresolved
```

- `## Typecheck` always emitted (single status line: `pass` | `patched N error(s)` | `FAILED after 3 attempts (see remaining below)` | `skipped`; remaining errors listed verbatim below the status line when FAILED).
- `## Files changed`, `## Defended`, `## Unresolved` keep the source body's "omit if empty" behavior.

### 7. Hard-constraint rewrite (phase-level)

The path-listing hard constraint is replaced with prose that generalizes across DS distribution shapes (installed package, vendored in-repo à la shadcn, etc.):

> Do not read, grep, or glob the design system's source — wherever it lives, including `index.d.ts`. **FACT.md is the only source for atom shape and props.**

This applies to round-1 (patched out-of-band during this task), round-2 (this port), and the reviewer (1.4 will inherit). Rationale: the original path list (`node_modules/<ds-pkg>/**`, `packages/<ds-pkg>/**`) silently assumes the DS is an installed package, which is wrong for vendored libraries. "Wherever it lives" captures the universal intent. The explicit `index.d.ts` clause is preserved because type declarations are the most tempting source to rationalize as fair game.

### 8. "Read" / "Edit" verbs kept verbatim

The body's "Read the file at the doubt's line." and "Edit the source." sentences are kept as-is. They are plain English verbs (sentence-initial capitalization, not tool-name references), and round-1 uses the same posture.

### 9. Verbatim retentions

The following source-body content is kept byte-for-byte:

- Doubt list YAML shape (`file` / `line` / `comment`).
- Section-enumeration grep one-liner (`grep -n '^## ' pastiche/KNOWLEDGE.md`) — no Brand-Identity exclusion needed for round-2 since it doesn't always-load Brand Identity (lazy-loads only what corrections need).
- `NewAtom` placeholder in carve-out greps.
- `pastiche/KNOWLEDGE.md`, `pastiche/WISDOM.md`, `pastiche/FACT.md` scaffold paths.
- "Default disposition is `corrected`" + the "untagged `defended` more than once or twice" bias-check guardrail.

## Invariants

- Canonical body has no frontmatter and no cross-references to pastiche-internal docs (`spec.md`, `OSS_SPEC.md`, `_dev/`, etc.) — it runs in the consumer's project at runtime.
- Source `_dev/agents/pastiche-implementer-round2.md` is deleted once the port lands.
- The hard-constraint rewrite (decision 7) lands in the same commit as the round-2 port to keep round-1 and round-2 consistent.

## Open items

None. All decisions raised during the grill were locked.
