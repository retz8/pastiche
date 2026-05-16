# skills/pastiche.md — canonical orchestrator port

Per-task spec for TODO 1.5: port `_dev/skills/pastiche/SKILL.md` → `skills/pastiche.md`. Inherits all phase-wide decisions from `docs/spec/phase-1-canonical-sources.md`. This spec captures only the per-task decisions locked during grilling.

## Scope

Mechanical port of the existing orchestrator body from `_dev/skills/pastiche/SKILL.md` to `skills/pastiche.md`, with the targeted changes below. No substantive workflow redesign.

## Locked decisions

### 1. Subagent dispatch names stay prefixed

The orchestrator body continues to dispatch by the prefixed long names: `pastiche-implementer-round1`, `pastiche-implementer-round2`, `pastiche-reviewer`. These are the sidecar `name:` values that consumers see post-install, regardless of platform. The shorter canonical filenames under `agents/` (`round1.md`, `round2.md`, `reviewer.md`) are a repo-internal organization detail and do not appear in dispatch references.

### 2. Frontmatter description kept verbatim

The existing description — `Use when implementing a frontend task — produces code that faithfully follows the project's design system and component library.` — is kept unchanged. Setup-state gating belongs in preflight, not in the trigger description.

### 3. Preflight retained, with remediation line appended

The preflight check on `pastiche/{FACT,KNOWLEDGE,WISDOM}.md` stays in the orchestrator (not pushed into `round1`). The failure message gains a remediation line referencing the v1 CLI:

> This project does not appear to have pastiche set up — expected `pastiche/{FACT,KNOWLEDGE,WISDOM}.md`. Run `pastiche init` to scaffold them.

### 4. No further "Claude-Code framing" to strip

The body is already platform-neutral as written. `Read` / `Edit` / `Bash` are in the documented neutral vocabulary (`docs/adapters/codex.md` §5). The `## Files changed` section name matches what the round agents emit. The `//` failsafe comment syntax is consistent with v1's JS/TS scope.
