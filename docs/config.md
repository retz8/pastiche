# config.yaml

Adopter-owned configuration at `pastiche/config.yaml`, colocated with FACT.md, KNOWLEDGE.md, WISDOM.md. It tells pastiche **where your components and tokens live** and **how to verify generated code**.

## Why it exists

Pastiche can't guess your repo layout — whether your components ship as `.d.ts` types or as copy-pasted source, where your CSS tokens live, how you typecheck. `config.yaml` answers that, once.

| Who/what | Interaction |
|---|---|
| `/pastiche-init` | Writes it — auto-detects `packages`, `tokens`, `typecheck_command`, `build_command` and asks you to confirm |
| `/pastiche-sync` | Re-reads it on every run and re-extracts FACT.md from the configured sources |
| `/pastiche-setup` | Writes `design_md_reference` and `setup_progress` |
| **You** | Own it. Edit any field by hand; the next sync honors the change |

## A complete example

A real config for an app using `@primer/react` (npm library with bundled types + CSS token files):

```yaml
platform: claude-code

packages:
  - name: "@primer/react"
    types:
      - "node_modules/@primer/react/dist/index.d.ts"
      - "node_modules/@primer/react/dist/experimental/index.d.ts"

tokens:
  - node_modules/@primer/primitives/dist/css/functional/size/size.css
  - node_modules/@primer/primitives/dist/css/functional/spacing/space.css
  - node_modules/@primer/primitives/dist/css/functional/themes/light.css

design_md_reference: null
typecheck_command: npx tsc --noEmit
build_command: npm run build

setup_progress:
  action-buttons: done
  # … 13 section slugs total
```

## Fields

| Field | Type | Meaning |
|---|---|---|
| `platform` | `claude-code` \| `codex` | Which adapter tree to generate. One per `init`; switching means re-running `init`. |
| `packages` | list | Where your components live. See [modes](#packages-two-modes) below. |
| `tokens` | list of paths | CSS files to harvest design tokens from. |
| `design_md_reference` | path \| `null` | Optional `DESIGN.md` to seed Brand Identity during setup. |
| `typecheck_command` | string \| `null` | Run by the implementer after writing code. `null` → skip typecheck. |
| `build_command` | string \| `null` | Run by the orchestrator as a final check. `null` → skip build. |
| `setup_progress` | map | 13 section slugs → `stub`/`done`. Machine-managed; don't hand-edit. |

## `packages`: two modes

Each entry has a unique `name` and **exactly one** of `types` or `source_dir`.

**Mode 1 — `types`** (npm libraries that ship `.d.ts` declarations). One path or a list:

```yaml
packages:
  - name: "@mui/material"
    types: node_modules/@mui/material/index.d.ts
  - name: "@primer/react"
    types:
      - node_modules/@primer/react/dist/index.d.ts
      - node_modules/@primer/react/dist/experimental/index.d.ts
```

**Mode 2 — `source_dir`** (shadcn-style components copied into your repo). One directory, walked for `.tsx`/`.ts`:

```yaml
packages:
  - name: ui
    source_dir: src/components/ui
```

On duplicate component-name exports across entries, the **first-listed entry wins**.

## `tokens`

A flat list of CSS file paths. The extractor harvests every CSS custom property (`--*`) and class selector from each file, regardless of where it's declared (`@theme`, `:root`, `[data-theme]`, …). Layer as many files as you need:

```yaml
tokens:
  - src/app/globals.css
  - src/styles/brand-tokens.css
```

## Deferred to v1.x

These fail-closed at lint time if present: per-file `.d.ts` globs (`types_glob`); token *format* declarations (`tailwind-v3-config`, `dtcg-json`, `js-export`); per-entry `extensions`, `exclude`, `prefix`, `selectors`. The fields `pastiche_version` and `fact_extractor` return when a second extractor lands.

## Related

- What gets extracted into [`fact.md`](./fact.md).
- Authored interactively by `/pastiche-init` and `/pastiche-setup`.
