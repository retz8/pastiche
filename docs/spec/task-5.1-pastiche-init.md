# Task 5.1 — Author `skills/pastiche-init.md`

Spec for TODO task 5.1: author the `/pastiche-init` slash-command skill that bootstraps pastiche in an adopter's frontend repo. Inherits from `docs/spec/phase-5-skills.md` and the upstream constraints in `docs/spec/phase-4-scripts.md` and `docs/spec/task-2.4-config-template.md`.

## Scope

Author `skills/pastiche-init.md` — the canonical skill body for the `/pastiche-init` slash command. The skill scaffolds the `pastiche/` directory in the adopter's repo (config, KNOWLEDGE template, WISDOM template) and runs the FACT extractor. It does not call lint, does not chain into `/pastiche-setup`, and does not write into `.claude/skills` or `.claude/agents` (those live in the plugin).

## Locked decisions

### 1. Re-run = fail-closed

If `pastiche/` exists at the resolved target path (any file present), init stops with a message pointing the adopter at `/pastiche-sync` (refresh FACT), `/pastiche-setup` (continue curation), or manual delete (reinitialize from scratch). Init never overwrites existing files. The strict verb-to-operation mapping (init = first time, sync = refresh FACT, setup = curate) is preserved; re-bootstrap is almost always operator error, and KNOWLEDGE/WISDOM accumulate hand-curation that an accidental overwrite would destroy.

### 2. `platform` hardcoded to `claude-code` in v1

No platform prompt. The `/pastiche-init` skill only exists because the adopter installed the plugin in Claude Code, so prompting for platform inside it is theatrical. Init writes `platform: claude-code` directly. The config schema retains `codex` as a legal value for forward-compat and hand-editing; when v1.x ships Codex support the prompt can be re-introduced.

### 3. `packages` and `tokens` populated via auto-detect + single confirmation

The skill body prescribes a *prior catalog + procedural outline*, not a deterministic detection algorithm. Claude pattern-matches against the adopter's repo using its file tools, drafts a full config block, presents it once for natural-language confirmation, and loops on patches until the adopter accepts. Mirrors the grammar from `skills/pastiche-setup.md`'s scenario sections.

**Per-stack priors** (referencing OSS_SPEC §9.4.1's four scenarios):
- Monorepo with built types (KISA-style) → workspace packages with `dist/index.d.ts`; `packages[].types`.
- npm DS with aggregate types (Primer / MUI / Mantine / Chakra) → `node_modules/<pkg>/dist/index.d.ts` (or `types`/`module` in the dep's `package.json`); `packages[].types`.
- Shadcn / copy-paste → `components.json` at repo root; `packages[].source_dir` pointing at configured aliases (typically `src/components/ui`).
- Hybrid (shadcn + custom, or DS + brand layer) → multiple entries combining modes.

**Per-token-file priors:**
- Tailwind v4 → look for `@theme` block (typical paths: `src/app/globals.css`, `src/styles/theme.css`).
- Plain CSS vars → look for `:root` blocks (typical paths: token-package CSS files, `globals.css`, `tokens.css`).

**Trusted to Claude:** edge cases (non-standard workspace names, weird `exports` fields, token files in unusual locations), exact tool calls for detection, classification confidence.

**Fallback when priors don't match:** single open-ended prompt — *"I couldn't classify your setup. Paste your config or describe your stack."* — no starting draft, still natural-language.

### 4. `typecheck_command` detection

Bundled into the same single draft confirmation as packages/tokens — the adopter sees the whole config in one turn and patches anything in natural language. No separate Q&A step. When no `package.json` typecheck script is found, the adopter may leave the answer blank and init writes `null`. Per phase-2 spec decision 8, `null` means implementer agents skip the typecheck step; lint does not fail-close on null. When `null` is written, init prints a one-line note: *"`typecheck_command` left null — implementers will skip the typecheck step."*

### 5. Repo-root discovery = `git rev-parse --show-toplevel` with cwd fallback

The skill body resolves the target directory via `git rev-parse --show-toplevel`; on failure (not a git repo) it falls back silently to cwd. The resolved path is displayed before the extractor runs (*"Writing to `<repo-root>/pastiche/`"*) so the adopter sees where init landed. No prompt — frictionless for the 95% case.

### 6. Extractor invocation

- **Working directory:** repo root (where `pastiche/config.yaml` lives). The extractor resolves `packages[].types`, `packages[].source_dir`, and `tokens[]` paths relative to this root.
- **Timing:** synchronous block after config + KNOWLEDGE/WISDOM templates are written, before the closing message. Init does not return until the extractor exits.
- **Failure handling: fail-loud, leave state (no rollback).** On non-zero exit, init prints the extractor's stderr verbatim and stops with: *"Extractor failed: <stderr>. Fix config or rebuild your DS, then run `/pastiche-sync` to retry FACT extraction. KNOWLEDGE/WISDOM templates and config are already in place."* The partially-bootstrapped `pastiche/` directory remains on disk; `/pastiche-sync` is the recovery path. Deleting `pastiche/` on extractor failure would punish the adopter for a recoverable error and lose the config they just confirmed.
- **Empty output:** if the extractor exits zero but writes no atoms, init warns — *"Extractor ran but found no atoms. Check your `packages[].types` / `source_dir` paths. You can re-run extraction with `/pastiche-sync`."* — and still completes successfully (templates and config are valid).

### 7. DESIGN.md handling at init time = none

Init does not scan for DESIGN.md, does not pre-fill `design_md_reference` in config (ships `null`), and does not copy any DESIGN.md content. The setup skill (`skills/pastiche-setup.md` first-run handshake, step 2) owns DESIGN.md detection. A single owner avoids two surfaces that could disagree.

### 8. Closing message — locked verbatim

On successful completion, init prints exactly:

> Pastiche initialized at `<repo-root>/pastiche/`.
>
> FACT.md extracted (`<N>` components, `<M>` tokens). KNOWLEDGE.md and WISDOM.md are stubs.
>
> Next: run `/pastiche-setup` to curate KNOWLEDGE and seed `[GENERAL]` WISDOM rules — section-by-section, resumable across sessions.

Three lines: state, content summary, single next-step pointer. No mention of `/pastiche-sync` (irrelevant on first run), `/pastiche-lint` (no docs to lint yet), or the main `/pastiche` skill (premature — docs empty). No emoji.

## Invariants

- Init writes only into `<repo-root>/pastiche/`. Nothing under `.claude/` is created in the adopter's repo (per Phase 4 spec decision 6 — skills and agents live in the plugin).
- The FACT extractor is invoked exclusively via `node $CLAUDE_PLUGIN_ROOT/dist/extract-fact.js` (per Phase 4 spec invariants).
- Init does not invoke `dist/lint.js` (per Phase 5 spec decision 5 — lint at init is a no-op against fresh templates).
- KNOWLEDGE.md and WISDOM.md are copied verbatim from this repo's `templates/`; init does not mutate template contents.
- `setup_progress` ships with all 13 keys at `stub` (inherited from task 2.4 spec decision 8); init does not touch this field.
