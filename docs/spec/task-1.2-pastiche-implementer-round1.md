# Task 1.2 — Port `pastiche-implementer-round1`

Per-task spec for TODO item **1.2**: port `_dev/agents/pastiche-implementer-round1.md` → `agents/pastiche-implementer-round1.md` + `agents/pastiche-implementer-round1.meta.yaml` sidecar. Inherits all phase-wide decisions from [`docs/spec/phase-1-canonical-sources.md`](./phase-1-canonical-sources.md).

## Scope

- Produce canonical agent body at `agents/pastiche-implementer-round1.md` (markdown, no frontmatter).
- Produce sidecar manifest at `agents/pastiche-implementer-round1.meta.yaml`.
- Delete `_dev/agents/pastiche-implementer-round1.md` after the port (Rule 5 discipline).
- All cross-task changes (FACT-gap removal in `skills/pastiche.md` and `spec.md`, `## Index` removal in `spec.md` + OSS_SPEC §9.2, codex adapter tool-restriction finding, OSS_SPEC §4.2 / §5 sidecar shape, phase-1 spec update) were applied out-of-band during grilling and are **not** in scope for this task's implementation step.

## Locked decisions

### 1. Per-platform sidecar manifests (Claude Code + Codex placeholder)

Two sidecars ship per agent.

**`agents/pastiche-implementer-round1.claude-code.meta.yaml`:**

- `name: pastiche-implementer-round1`
- `description: Faithful frontend execution of a task against the project's KNOWLEDGE.md and WISDOM.md.`
- `model: opus`
- `tools: [Read, Edit, Write, Bash, Glob]`

**`agents/pastiche-implementer-round1.codex.meta.yaml`** (placeholder — Codex untested in v1 per phase-1 decision 1f):

- `name: pastiche-implementer-round1`
- `description: Faithful frontend execution of a task against the project's KNOWLEDGE.md and WISDOM.md.`
- `model: gpt-5-codex`
- `sandbox_mode: workspace-write`

`name` and `description` are identical across both sidecars (drift-prevention). The description omits any "Pastiche round-1 implementer." preamble — the agent's role is conveyed by the filename and `name:` field. Codex sidecar carries a banner comment marking it unverified.

### 2. Workflow step 2 — section enumeration

The source body's "list the section index" step is rewritten to:

1. Read KNOWLEDGE.md's Brand Identity section in full first (always-loaded).
2. Then enumerate the *remaining* canonical section headings via grep, excluding `## Brand Identity` from results so it is not re-considered downstream.

Rationale: source had Brand Identity loaded in step 1, then re-listed in step 2's section grep — risking re-read in step 3. Excluding it from step 2 collapses the duplication.

### 3. Workflow step 3 — neutral line-range phrasing

The source body's "Read tool with `offset` = section's start line, `limit` = next-H2-line minus start" is rewritten to neutral phrasing that preserves the operational intent (line-range read, not whole-file read) without naming a Claude-Code-specific tool. Both Claude Code and Codex expose line-range read primitives; the canonical body does not name either.

### 4. Typecheck step added after implementation

A new workflow step runs after the implementation step (step 7 in the source body):

- Run the command at `typecheck_command` in `pastiche.config.yaml`. If null or absent, skip the step (and the report's `## Typecheck` line reads `skipped`).
- For each error returned by the typecheck tool, patch the code using the compiler error message as ground truth (the message itself is the authoritative source for prop names, accepted union values, etc.). The hard constraint banning DS-package source-diving still applies; compiler error text is not source-diving.
- Bounded to 3 patch attempts per failing error. After the bound, list remaining errors verbatim in the report.

### 5. Hard constraint addition

Add to the existing hard-constraint section: **"Do not grep FACT while patching."** FACT is grepped exactly once per task (in the original prop-signature step). The typecheck patching phase reasons about FACT using only what is already in context from that single grep. The carve-out for genuinely new atoms introduced by corrections (already permitted by the philosophical workflow) is not exercised during typecheck patching.

### 6. Report format changes

The report skeleton is updated:

- Drop the `## FACT gaps` section entirely (phase decision 1b).
- Add a `## Typecheck` section with a single status line: `pass` | `patched N error(s)` | `FAILED after 3 attempts (see remaining below)` | `skipped`. Remaining errors, if any, are listed verbatim below the status line.
- `## Files changed`, `## Atoms used`, and `## KNOWLEDGE gaps` are kept unchanged.

### 7. Verbatim content

The following source-body content is kept verbatim (project-agnostic already, no de-KISA needed):

- The hard-constraint paragraph banning reads/greps/globs inside `node_modules/<ds-pkg>/**` etc., including the `index.d.ts` clause. v1 is JS/TS only per phase invariants.
- Generic atom placeholders `AtomA`, `AtomB`, `AtomC` in code-fence examples.
- All references to `pastiche/KNOWLEDGE.md`, `pastiche/WISDOM.md`, `pastiche/FACT.md` paths — these are the canonical scaffold paths created by `pastiche init`.
- The "senior frontend engineer" voice in the opening paragraph.
- Bash one-liners using `awk` / `grep` — both Claude Code and Codex expose a shell.

## Invariants

- Canonical body has no frontmatter and no cross-references to pastiche-internal docs (`spec.md`, `OSS_SPEC.md`, `_dev/`, etc.) — it runs in the consumer's project at runtime.
- Source `_dev/agents/pastiche-implementer-round1.md` is deleted once the port lands.

## Open items

None. All decisions raised during the grill were either locked or explicitly deferred (FACT-overrides surface → after Phase 6.7).
