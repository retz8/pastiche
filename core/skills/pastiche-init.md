---
name: pastiche-init
description: Use when bootstrapping pastiche in a frontend repo for the first time — scaffolds `pastiche/{config.yaml, FACT.md, KNOWLEDGE.md, WISDOM.md}` and extracts FACT. Single-use; refuses to overwrite. Curation happens later via `/pastiche-setup`.
---

# Pastiche — init

Bootstrap pastiche in the user's repo. Refuses to touch an existing `pastiche/` — the verb is `init`, not `update`.

## Preflight

1. Resolve repo root: `git rev-parse --show-toplevel`; on failure, fall back silently to cwd. Print: *"Writing to `<repo-root>/pastiche/`."*
2. If `<repo-root>/pastiche/` contains any file, stop:
   > `pastiche/` already exists. Run `/pastiche-sync` to refresh FACT, `/pastiche-setup` to continue curation, or delete `pastiche/` first to reinitialize.

## Detect

Read `<repo-root>/package.json` and probe canonical locations. Classify against these priors; combine as needed.

**`packages`:**
- Workspace package with `dist/index.d.ts` → `types:` (monorepo / built lib).
- npm dep with `node_modules/<pkg>/dist/index.d.ts` (or `types`/`module` in its `package.json`) → `types:` (Primer / MUI / Mantine / Chakra shape).
- `components.json` at repo root → `source_dir:` pointing at the configured alias dir (shadcn).
- Multiple coexist → multiple entries.

**`tokens`:**
- CSS file containing `@theme { ... }` → Tailwind v4 theme file.
- CSS file containing `:root { --... }` → plain CSS vars.

**`typecheck_command`:** check `package.json` `scripts` for `typecheck` / `type-check` / `tsc`. Detect package manager from lockfile (`pnpm-lock.yaml` → `pnpm`, `yarn.lock` → `yarn`, `bun.lock` → `bun`, else `npm run`). Compose accordingly.

**`build_command`:** check `package.json` `scripts` for `build`. Detect package manager from lockfile (same as above). Compose accordingly (e.g., `npm run build`).

Use file tools freely. Trust your judgment on non-standard workspace names, weird `exports` fields, or unusual token paths.

## Draft + confirm

Present the full proposed config in one block — `platform: claude-code` (hardcoded), then drafted `packages`, `tokens`, `typecheck_command`, `build_command`. Ask:

> Looks right? Edit anything?

If the user requests edits, apply them to the current draft and re-display the updated config. Do not re-run detection. Loop until the user accepts.

If detection produced nothing usable, skip the draft and prompt:
> I couldn't classify your setup. Paste your config or describe your stack.

Then draft from the response and confirm as above.

## Write

Once accepted, write:

1. `<repo-root>/pastiche/config.yaml` — read the template from this skill's sibling `templates/config.yaml` directory, mutate `platform`, `packages`, `tokens`, `typecheck_command`, `build_command`. Leave `design_md_reference: null` and `setup_progress` untouched (13 stubs).
2. `<repo-root>/pastiche/KNOWLEDGE.md` — copy `templates/KNOWLEDGE.md` (sibling to this skill's directory) verbatim.
3. `<repo-root>/pastiche/WISDOM.md` — copy `templates/WISDOM.md` (sibling to this skill's directory) verbatim.

If the user left `typecheck_command` blank, write `null` and print:
> `typecheck_command` left null — implementers will skip the typecheck step.

If the user left `build_command` blank, write `null` and print:
> `build_command` left null — the orchestrator will skip the final build check.

Do not scan for `DESIGN.md`. Do not pre-fill `design_md_reference`. `/pastiche-setup` owns that surface.

## Extract FACT

Shell: `extract-fact` (cwd = `<repo-root>`). It is on PATH via the plugin's `bin/` — do not search for it. Block on completion.

- **Non-zero exit** — print stderr verbatim, then stop:
  > Extractor failed: <stderr>. Fix config or rebuild your DS, then run `/pastiche-sync` to retry FACT extraction. KNOWLEDGE/WISDOM templates and config are already in place.

  Do not delete `pastiche/`. The partial state is the recovery point for `/pastiche-sync`.
- **Zero exit, no atoms written** — warn and proceed to Close:
  > Extractor ran but found no atoms. Check your `packages[].types` / `source_dir` paths. You can re-run extraction with `/pastiche-sync`.

## Close

Print exactly:

> Pastiche initialized at `<repo-root>/pastiche/`.
>
> FACT.md extracted (`<N>` components, `<M>` tokens). KNOWLEDGE.md and WISDOM.md are stubs.
>
> Next: run `/pastiche-setup` to curate KNOWLEDGE and seed `[GENERAL]` WISDOM rules — section-by-section, resumable across sessions.

Do not invoke another skill. Do not run lint.
