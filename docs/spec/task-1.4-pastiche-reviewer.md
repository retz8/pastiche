# Task 1.4 — Port `pastiche-reviewer`

Per-task spec for TODO item **1.4**: port `_dev/agents/pastiche-reviewer.md` → `agents/pastiche-reviewer.md` + `agents/pastiche-reviewer.claude-code.meta.yaml` + `agents/pastiche-reviewer.codex.meta.yaml`. Inherits all phase-wide decisions from [`docs/spec/phase-1-canonical-sources.md`](./phase-1-canonical-sources.md).

## Scope

- Produce canonical agent body at `agents/pastiche-reviewer.md` (markdown, no frontmatter).
- Produce two sidecars: `agents/pastiche-reviewer.claude-code.meta.yaml` and `agents/pastiche-reviewer.codex.meta.yaml`.
- Delete `_dev/agents/pastiche-reviewer.md` after the port (Rule 5 discipline).

## Locked decisions

### 1. Per-platform sidecar manifests (Claude Code + Codex placeholder)

Two sidecars ship per agent.

**`agents/pastiche-reviewer.claude-code.meta.yaml`:**

- `name: pastiche-reviewer`
- `description: Raises design-system doubts on a round-1 implementation by checking it against FACT.md and WISDOM.md.`
- `model: sonnet`
- `tools: [Read, Bash, Glob]`

**`agents/pastiche-reviewer.codex.meta.yaml`** (placeholder — Codex untested in v1 per phase-1 decision 1f):

- `name: pastiche-reviewer`
- `description: Raises design-system doubts on a round-1 implementation by checking it against FACT.md and WISDOM.md.`
- `model: gpt-5-codex`
- `sandbox_mode: read-only`

`name` and `description` are identical across both sidecars (drift-prevention). The description omits any "Pastiche reviewer." preamble. The Codex sidecar carries a banner comment marking it unverified.

### 2. Sandbox / tool allowlist enforces read-only contract

The reviewer is a read-only agent: it reads FACT.md, reads changed files, greps WISDOM.md, and emits a YAML doubt list. It never mutates state. Both sidecars encode this contract — Claude Code via `tools: [Read, Bash, Glob]` (no `Edit`/`Write`); Codex via `sandbox_mode: read-only`. `Glob` is retained on the Claude Code side as the source body declared it; it is cheap to leave in.

### 3. Model selection

Claude Code: `sonnet`. The reviewer's job is bounded and pattern-matchy (FACT pass, WISDOM grep, three speculative-doubt patterns, YAML emission) — exactly the workload sonnet is well-suited for. The doubt-defense loop's design intent is that depth comes from the dialogue, not from a heavy reviewer.

Codex: `gpt-5-codex`, same as the implementer sidecars. v1 Codex sidecars are unverified placeholders; consistency across the three agents is the right default. A lighter Codex model variant may be revisited in the v1.x community-validation milestone.

### 4. Hard-constraint rewrite (phase decision 1g, applied)

The source body's path-listing DS-source ban is replaced verbatim with the canonical 1g phrasing. The reviewer-specific trailing FACT-gap sentence (*"If FACT seems to lack a prop or detail, raise it as a doubt; do not source-dive to verify."*) is **dropped**.

Rationale: phase decision 1b stripped `fact-gap` defend-tag handling from round-2, so a reviewer-emitted FACT-gap doubt has no clean resolution path. Prop-level reality is owned by the implementer's typecheck step under 1b. Round-1's analogous tail (*"If FACT lacks something you need, fall back to raw HTML/Tailwind."*) is preserved because it gives the implementer an actionable alternative; the reviewer has no analogous action — its only output is doubts.

Final reviewer hard-constraint paragraph:

> Do not read, grep, or glob the design system's source — wherever it lives, including `index.d.ts`. **FACT.md is the only source for atom shape and props.**

### 5. Phase decisions 1c and 1d do not apply

The Index removal (1c) and the typecheck step (1d) do not apply to the reviewer port. The reviewer does not read KNOWLEDGE.md and does not run typecheck.

### 6. Report format unchanged

The reviewer's final output remains the strict-YAML doubt list with exactly the three keys `file`, `line`, `comment` (or the literal `[]` when no doubts). This is the contract round-2 consumes; format must not change.

### 7. Verbatim content

The following source-body content is kept verbatim (already project-agnostic, no de-KISA needed):

- The "senior UI/UX designer" voice in the opening paragraph.
- Workflow steps 1–7 (FACT pass, WISDOM pass, speculative-doubt patterns, expert-voice phrasing requirement).
- Generic atom placeholders `AtomA`, `AtomB`, `AtomC` in the WISDOM grep example.
- All references to `pastiche/FACT.md`, `pastiche/WISDOM.md` paths — these are the canonical scaffold paths created by `pastiche init`.
- The strict-YAML report-format section and example.

## Invariants

- Canonical body has no frontmatter and no cross-references to pastiche-internal docs (`spec.md`, `OSS_SPEC.md`, `_dev/`, etc.) — it runs in the consumer's project at runtime.
- Source `_dev/agents/pastiche-reviewer.md` is deleted once the port lands.

## Open items

None.
