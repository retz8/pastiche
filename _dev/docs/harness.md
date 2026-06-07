# Post-v1 daily work harness

Locked design for how post-v1 work flows from `_dev/TODO.md` through tasks, sub-tasks, the nightly Claude routine, and the Monday review window. Governs all work tracked in `_dev/TODO.md`.

## Scope

- The task → sub-task structure and its GitHub representation (issues, labels, milestones).
- Branching, merging, and review flow between sub-task branches, feature branches, and `main`.
- Commit and versioning conventions, the release ritual, and the changelog.
- Which `_dev/` artifacts are git-tracked.
- The skill inventory supporting the harness.

## Locked decisions

### 1. Hierarchy

`_dev/TODO.md` groups (one minor version each) → tasks → sub-tasks. One task = one TODO line; sub-tasks are the implementation steps of a task, derived after the task spec is written.

### 2. Task kickoff

Every task starts with `grill-me` → `grill-to-spec`. If needed, an implementation plan follows (plan mode or `superpowers:writing-plans`). Plan docs live at `_dev/docs/<branch-name>/` (e.g. `_dev/docs/1.1.0/codex-support/`). Plan docs for off-backlog small fixes go to `_dev/docs/patches/`.

### 3. Issues at both levels

Each task gets a parent GitHub issue (created at backlog creation, PRD-altitude body). Each sub-task becomes a child issue linked under the parent. A parent issue opens at creation and closes when its feature branch merges to `main`; the TODO.md checkbox is ticked at the same moment.

### 4. Sub-task division

Runs after grill-to-spec, via the `divide-task` skill. Each sub-task is analyzed for: (1) autonomy — mechanical change → label `autonomous-ready`, needs human judgment → label `decision-needed`; (2) dependencies and execution order — blocked sub-tasks get `blocked-by-<issue-number>`; (3) parallelism — sub-tasks not touching the same files/logic may run concurrently. The sub-task list is also mirrored into `_dev/TODO.md` under its task, and the parent task issue is updated — sub-task issues linked under it, spec referenced.

### 5. Label lifecycle

When a blocking sub-task completes, its `blocked-by-<its-issue-number>` label is removed from every issue it was blocking. This is embedded behavior (routine prompt + live-session convention), not a skill.

### 6. Branching model

Feature branch per task, named `<version>/<task-name>` (e.g. `1.1.0/codex-support`), based off `main`. Sub-task branches named `<feat>/<sub-task-name>` (e.g. `codex-support/add-meta-yaml`), based off the feature branch — used by the nightly routine, which PRs sub-task → feat when done. Live sessions use worktrees based off the feature branch; the user may direct work directly on the current branch when nothing runs in parallel.

### 7. Routine eligibility gate

The nightly routine reads `_dev/TODO.md` and only picks up sub-task issues belonging to the `[WIP]` task. Issues of future tasks are ineligible regardless of labels. `pick-up-task` marks a task `[WIP]` at pickup.

### 8. Merge policy

The routine auto-merges `autonomous-ready` sub-task PRs into the feature branch — `autonomous-ready` means truly ready for merge. Monday review examines the accumulated feature-branch diff, not individual sub-task PRs. Nothing reaches `main` without human review of the feat→main PR.

### 9. Monday corrections

Problems found while reviewing the merged feature branch are fixed directly on the feature branch in the live session (`fix(<task>): ...`). Substantial rework is promoted to a new sub-task issue instead. Boundary: fixable within the live session → direct; needs its own night → new issue.

### 10. Commit convention

Full conventional commits. `<type>(<task-name>): ...` on feature/sub-task branch work; `<type>: ...` outside any task.

### 11. Versioning

Tasks complete with no version change. A group shipping = one minor bump. Patch numbers are reserved for hotfixes between releases. Planned version numbers in TODO.md are provisional — assigned for real at release time. Version bumps are a human (Monday) decision, never the routine's.

### 12. Release ritual

`release-pastiche` skill, run on `main` after the group's final feat→main merge: bump `package.json` → rebuild the plugin → append a CHANGELOG.md section (Keep a Changelog format, derivable from `feat`/`fix` commits since the last release) → single `chore(release): v<version>` commit → git tag `v<version>` → GitHub Release with the changelog section as body → close the milestone.

### 13. Hotfix absorption

When a hotfix lands on `main` while a feature branch is in flight, the feature branch is rebased onto `main` via the `rebase-feat-with-main` skill. `pick-up-task` always runs it when resuming a task.

### 14. GitHub structure

One milestone per minor group; task issues assigned to their milestone. Labels: `autonomous-ready`, `decision-needed`; `blocked-by-<issue#>` created on demand — no `task` label. Every issue title carries its TODO-ordinal number in brackets: parents `[3] <name>`, sub-tasks `[3.1] <name>`. The bracket prefix is what distinguishes parents from sub-tasks. Task numbers are independent of GitHub issue numbers.

### 15. Git visibility

`_dev/TODO.md`, `_dev/docs/`, and `.claude/` (skills — the routine invokes them) are git-tracked. `_dev/archive/` and `_dev/templates/` stay gitignored. `.agents/` stays ignored — sub-task issues are light enough that execution needs no dedicated agents; good planning covers it.

### 16. Skill inventory

| Skill | Status |
|---|---|
| `pick-up-task` | upgrade — `[WIP]` marking, branch creation/resume, always rebase with main, worktree handling |
| `divide-task` | new — spec → sub-task issues with labels → TODO.md mirror |
| `rebase-feat-with-main` | new — rebase current feature branch onto main |
| `release-pastiche` | new — the release ritual |

Conventions not in skills (merge policy, Monday rules, commit convention) are documented in CLAUDE.md.

## Open items

- Nightly routine runtime and configuration (where it runs, schedule, prompt) — deferred to a dedicated discussion.
