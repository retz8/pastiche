# Task 5.2 — Author `skills/pastiche-sync.md`

Spec for TODO task 5.2: author the `/pastiche-sync` slash-command skill that refreshes FACT in the adopter's frontend repo. Inherits from `docs/spec/phase-5-skills.md`, `docs/spec/phase-4-scripts.md`, and `docs/spec/task-5.1-pastiche-init.md`.

## Scope

Author `skills/pastiche-sync.md` — the canonical skill body for the `/pastiche-sync` slash command. The skill re-runs the bundled FACT extractor, overwrites `pastiche/FACT.md`, runs the bundled lint script as a self-check, and reports drift back to the user. Sync is FACT-only; it does not curate KNOWLEDGE/WISDOM and does not walk the user through remediation.

## Locked decisions

### 1. Preflight = hybrid

Sync resolves the repo root, then checks that `<repo-root>/pastiche/config.yaml` exists. Two failure shapes are handled differently:

- **`pastiche/` missing entirely, or `config.yaml` missing inside it** — sync stops before invoking the extractor with: *"`<repo-root>/pastiche/config.yaml` not found. Run `/pastiche-init` first."* The "you forgot to bootstrap" case deserves a tailored message rather than the extractor's generic "config not found" error.
- **`config.yaml` exists but is malformed** — sync invokes the extractor unchanged; the extractor exits non-zero with its own diagnostic; sync forwards stderr verbatim and stops. Config validation is owned by the extractor; sync does not reimplement it.

### 2. Repo-root discovery = `git rev-parse --show-toplevel` with cwd fallback

Symmetric to init (task 5.1 decision 5). On `git rev-parse` failure, sync falls back silently to cwd. Before running the extractor, sync prints *"Syncing `<repo-root>/pastiche/FACT.md`."* so a wrong-directory invocation is visible immediately. Diverging path-resolution semantics across the init/sync verb pair would be a footgun.

### 3. Diff/drift reporting = none beyond extractor summary + lint output

Sync does not implement atom-level diffs (added / removed / renamed) and does not paste raw textual diffs. The extractor already prints `"Wrote pastiche/FACT.md: N components, M tokens."`; lint surfaces the *consequential* drift (orphaned tags in WISDOM/KNOWLEDGE). For full textual change inspection, the closing message points the user at `git diff pastiche/FACT.md`. Atom-level diff would be the start of remediation infrastructure, which violates sync's locked FACT-only scope.

### 4. Lint self-check semantics

- **Timing:** runs unconditionally immediately after extractor success, before the closing message. Sync does not gate lint on detected changes (sync does not know what changed).
- **Output handling:** forwards lint's stdout (summary) verbatim; if lint exits non-zero, also forwards stderr (violation list) verbatim. No reformatting, prefixing, or wrapping.
- **Exit-code handling:** captured but not propagated. Sync's closing message is determined by which case occurred (clean / drift / crash), not by exit code. Sync itself does not exit non-zero on lint violations — fail-warn.
- **Crash vs. violations distinction:** if lint exits non-zero AND there is no stdout summary, treat it as an internal crash (a bug in the lint script). If lint exits non-zero WITH a stdout summary, treat it as violations. The distinction drives different closing messages so the user is not misled into thinking they have drift to fix when the lint script itself broke.

### 5. Closing message — three cases locked verbatim

**Clean (lint exit 0):**
> Pastiche synced. FACT.md regenerated; no drift detected.
>
> Run `git diff pastiche/FACT.md` to inspect changes.

**Drift (lint exit non-zero, with stdout summary):**
> Pastiche synced — FACT.md regenerated, lint surfaced drift (see violations above).
>
> Remediate by editing `pastiche/WISDOM.md` / `pastiche/KNOWLEDGE.md` directly, or use `/pastiche-write-wisdom` / `/pastiche-write-knowledge` to add or replace rules. Run `git diff pastiche/FACT.md` to inspect the FACT changes that triggered the drift.

**Crash (lint exit non-zero, no stdout summary):**
> Pastiche synced. FACT.md was regenerated successfully, but the lint script crashed unexpectedly (output above). Report this to the pastiche maintainers.
>
> Run `git diff pastiche/FACT.md` to inspect changes.

The drift case explicitly does not mention `/pastiche-setup`. Setup is a section-by-section curation flow, not a targeted remediation tool; mentioning it would confuse the boundary the Phase 5 spec locked. The right granular remediation tools are `/pastiche-write-wisdom`, `/pastiche-write-knowledge`, or hand-edit.

## Invariants

- Sync writes nothing in the adopter's repo except via the extractor (which overwrites `pastiche/FACT.md`). KNOWLEDGE.md, WISDOM.md, and config.yaml are never touched by sync.
- Sync invokes scripts exclusively via `node $CLAUDE_PLUGIN_ROOT/dist/{extract-fact,lint}.js`.
- Sync does not orchestrate the `/pastiche-lint` skill — it invokes the lint script directly (per Phase 5 spec decision 6).
- Sync is naturally idempotent; no state is tracked between runs.
- Extractor failure after preflight passes follows decision 1's posture: print stderr verbatim, stop, do not run lint.
