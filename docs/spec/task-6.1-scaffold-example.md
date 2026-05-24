# Task 6.1 — Scaffold example app + symlink-install plugin

Covers TODO item **6.1**: scaffold a Next.js + `@primer/react` + TypeScript skeleton at `examples/github-primer-react/` and symlink-install the pastiche plugin. Inherits from phase spec `docs/spec/phase-6-reference-adoption.md`.

## Scope

- Scaffold a runnable Next.js app router project at `examples/github-primer-react/`
- Wire up `@primer/react` with ThemeProvider and BaseStyles
- Create route stubs for three pages (issues list, issue detail, new-issue composer)
- Add a layout shell with a minimal GitHub-style header
- Symlink-install the pastiche plugin
- Commit the result (no page bodies, no FACT extraction, no KNOWLEDGE/WISDOM)

## Locked decisions

### 1. Directory structure: `src/app/`

Uses the `src/` convention to keep config files separate from application code and match realistic production app structure.

### 2. Routing

`/` redirects to `/issues` via `redirect()`. Three route stubs: `/issues` (list), `/issues/[id]` (detail), `/issues/new` (composer). Mirrors GitHub's actual URL structure.

### 3. Layout shell: minimal header mimicking GitHub

A header-only shell using Primer components, visually resembling GitHub's production header. Not fully functional — just enough chrome to make the app feel navigable. No sidebar, no footer. User will provide a reference screenshot at implementation time.

### 4. Page stubs: heading only

Each page stub renders a single heading (e.g. "Issues", "Issue #[id]", "New Issue"). No placeholder text, no other content. Page bodies are built via pastiche tasks in 6.5.

### 5. ThemeProvider color mode: `day`

Forced light mode for predictable output during artifact evaluation in 6.5. Can be switched to `auto` later.

### 6. Scaffold method: `create-next-app` with flags, then trim

Run `create-next-app` with `--ts --eslint --app --src-dir --no-tailwind --use-npm`, then trim default boilerplate (Vercel icons, default page content, global CSS).

### 7. Dev dependencies: default ESLint only

Keep the ESLint config that `create-next-app` provides. No Prettier, no extra plugins.

### 8. Symlink: committed to git

Create `examples/github-primer-react/.claude/plugins/pastiche` as a symlink to `../../../dist-plugin/` and commit it. The symlink should just work on clone.

### 9. Package name: `github-primer-react`

Matches the directory name. Never published to npm.

### 10. Example `.gitignore`

Covers `node_modules/`, `.next/`, `next-env.d.ts`. Pastiche files (`pastiche/`) are committed per phase spec §15. `dist-plugin/` is already gitignored at repo root.
