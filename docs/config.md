# `pastiche/config.yaml` — field reference

Adopter-owned configuration for a pastiche-installed project. Lives at `pastiche/config.yaml`, colocated with `FACT.md`, `KNOWLEDGE.md`, `WISDOM.md`.

For the full schema block, the four supported stack scenarios, and design rationale, see `_dev/docs/OSS_SPEC.md` §9.4 and §9.4.1. This page is a quick per-field reference.

## Editing

The file ships from `pastiche init` with empty/null sentinels. `init` fills required fields via prompts and detection; `/pastiche-setup` mutates `setup_progress` and `design_md_reference`. The adopter may edit any field. `pastiche sync` re-reads the file on every run.

## Fields

### `platform`

Single string. One of `claude-code` or `codex`. `null` until `init` runs. v1 generates one adapter tree per `init`; switching platforms means re-running `init`.

### `packages`

List. Each entry declares one source of component types.

Required: `name` (string, unique across entries). Exactly one of:
- `types: <path>` — aggregate `.d.ts` file (npm-distributed libraries with bundled declarations).
- `source_dir: <path>` — directory of source files (shadcn-style copy-paste libraries).

Optional on `source_dir` entries: `extensions` (list of file extensions to scan; default `[".tsx", ".ts"]`).

Ordering is preserved; on duplicate component-name exports, the first-listed entry wins.

### `tokens`

List. Each entry declares one source of design tokens.

Required: `format` (one of `tailwind-v4-theme`, `css-vars`) and `source` (path to a CSS file).

Optional on `css-vars` entries: `selectors` (list of CSS selectors to harvest `--*` vars from; default `[":root"]`).

Both formats also harvest class selectors (`.btn-primary`, `.text-h1`) from the same file as token-atoms. Multiple `tokens` entries layer freely.

### `design_md_reference`

Path string or `null`. Points at the project's `DESIGN.md` (or equivalent) when the adopter opts in during `/pastiche-setup`. Non-root paths allowed (e.g., `docs/DESIGN.md`).

Safety: path is resolved to absolute, verified to exist and live inside the consumer repo. Read-time failure → warn and proceed as `null`. Write-time failure → reject opt-in.

### `typecheck_command`

String or `null`. Full shell command (e.g., `"pnpm typecheck"`, `"npm run typecheck"`). `null` means the implementer agents skip the typecheck step. `init` auto-detects from `package.json` scripts and prompts to confirm.

### `setup_progress`

Map of 13 kebab-case section slugs (12 KNOWLEDGE sections + `general-wisdom`) to status strings (`stub` | `done`). Same slug accepted as `/pastiche-setup --section <slug>`. State flips from `stub` → `done` as setup walks each section. Machine-managed; the adopter does not normally edit this block.

Canonical keys (order matches the template):

```
action-buttons, forms-input-collection, feedback-status, overlays,
navigation-wayfinding, content-display, layout-page-structure,
date-time-selection, iconography, visual-hierarchy,
domain-specific-patterns, brand-identity, general-wisdom
```

## Deferred to v1.x

The following fields and formats are not in v1 and will fail-closed at lint time if specified:

- `types_glob` (per-file `.d.ts` with no aggregate)
- Token formats `tailwind-v3-config`, `dtcg-json`, `js-export`, `classes`
- Per-package `exclude` (glob array), per-token `prefix` (filter string)
- The dropped fields `pastiche_version` and `fact_extractor` return in v1.x when a real comparison target exists (see OSS_SPEC §14.1).

## Stack scenarios

See OSS_SPEC §9.4.1 for full configs covering the four supported combinations:

1. Monorepo with aggregate `.d.ts` + Tailwind v4 theme (KISA-style).
2. npm aggregate `.d.ts` + CSS-vars token files (Primer / MUI).
3. shadcn source-walk + Tailwind v4 (canonical 2026 React setup).
4. shadcn source-walk + multiple token files.
