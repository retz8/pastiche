# pastiche

## What this project is

Pastiche is a **Claude skill (and forthcoming OSS package) for faithful design-system execution** by LLM coding agents. Given a frontend task, it produces code that follows an established design system + component library — not by inventing, but by faithfully executing within the established vocabulary.

The skill operates over three documents that form an epistemological hierarchy:

- **FACT.md** — mechanical catalog of every token, component, and prop. Auto-extracted from the codebase.
- **KNOWLEDGE.md** — curated scenario→atom mappings (the "absent designer") + brand-identity prose.
- **WISDOM.md** — atom-tagged rules. Atom-intrinsic only; scenario-conditional rules live in KNOWLEDGE.

The runtime mechanism is a **bounded doubt-defense loop**: `pastiche-implementer-round1` produces code → `pastiche-reviewer` raises strict-YAML doubts → `pastiche-implementer-round2` corrects or defends. Depth comes from the dialogue, not from a heavy reviewer.

**Required reading:** `spec.md` (philosophy), `_dev/TODO.md` (post-v1 backlog).

## How to work in this repo

### Daily work harness

Full design: `_dev/docs/harness.md`. Summary:

- **Hierarchy**: `_dev/TODO.md` groups (one minor version each) → tasks (parent GH issue + feature branch `<version>/<task-name>`) → sub-tasks (child GH issues + `<feat>/<sub-task-name>` branches).
- **Task kickoff**: `pick-up-task` (marks `[WIP]`, handles branch) → `grill-me` → `grill-to-spec` → plan if needed (plan docs at `_dev/docs/<branch-name>/`; small patches at `_dev/docs/patches/`) → `divide-task` (sub-task issues labeled `autonomous-ready` / `decision-needed` / `blocked-by-<issue#>`, mirrored into TODO.md).
- **Execution**: nightly routine picks only `autonomous-ready`, unblocked sub-tasks of the `[WIP]` task; PRs sub-task → feat and auto-merges. Live sessions use worktrees off the feat branch unless told otherwise. When a blocker completes, remove its `blocked-by-#` label from blocked issues.
- **Review**: Monday session reviews the accumulated feat diff. Small fixes directly on feat; substantial rework → new sub-task issue. Nothing reaches `main` without human review of the feat→main PR.
- **Commits**: conventional commits — `<type>(<task-name>):` on task work, `<type>:` otherwise.
- **Releases**: tasks don't bump versions. Group complete → `release-pastiche` on main (bump → build → CHANGELOG → tag → GH Release → close milestone). Patch = hotfix only; in-flight feat branches absorb hotfixes via `rebase-feat-with-main`.

### Invariants

- **Project-agnostic.** No canonical or adapter file embeds KISA atom names, paths, or phrasing. KISA atoms only appear in `examples/primer-react/` (the reference adoption — not yet built, see OSS_SPEC §12).
- **Canonical vs adapter discipline**: canonical sources are platform-agnostic markdown bodies; per-platform envelopes live in `adapters/<platform>/*.template`; built outputs are not committed.

### What this repo is not

Not a design system, not a general code reviewer, not a runtime UI protocol, not Claude-Code-only. v1 targets Claude Code + Codex.
