# FACT.md

The mechanical catalog of every component and token that exists in your codebase. Auto-generated; never hand-edited.

## Why it exists

FACT.md is pastiche's **ground truth**. It is the bottom of the three-document hierarchy — pure machine-extracted fact, no opinion.

| Who/what | How it uses FACT.md |
|---|---|
| The **implementer** agent | Greps it for the exact props of the atoms it plans to use — the only allowed source for component shape. It never reads your library's source. |
| The **reviewer** agent | Checks generated code against it. A component or prop not in FACT.md is, by definition, **invented** — and gets flagged. |
| **You** | Don't edit it. Regenerate it when the codebase changes (`/pastiche-sync`). Read it if you want to see exactly what the extractor found. |

If FACT.md is wrong or stale, every layer above it inherits the error — so it is regenerated, never patched by hand.

## Lifecycle

```
/pastiche-init   → first extraction
/pastiche-sync   → re-extraction after the component library or tokens change
```

The header banner marks the file auto-generated. Editing it by hand is overwritten on the next sync.

## Format

Two sections: **Components** (a YAML map) and **Tokens** (flat lines).

### Components

A YAML map keyed by atom (component) name. The implementer reads it lazily — one `grep` per atom, never the whole file.

```yaml
PageLayout:
  pkg: "@primer/react"
  containerWidth?: [full, medium, large, xlarge]
  padding?: [none, condensed, normal]
  _slotsConfig?: "Record<'header' | 'footer' | 'sidebar', React.ElementType>"
  className?: string
Radio:
  pkg: "@primer/react"
  spreads: [InputHTMLAttributes<HTMLInputElement>]
  value: string
  disabled?: bool
  checked?: bool
```

Reading the entries:

| Syntax | Meaning |
|---|---|
| `Atom:` at column 0 | The atom's name — what the implementer greps for |
| `pkg:` | The package the atom is exported from |
| `prop: type` | **Required** prop |
| `prop?: type` | **Optional** prop (note the `?`) |
| `[a, b, c]` | Enum — the allowed literal values |
| `spreads: [...]` | Prop types this atom inherits by spreading (e.g. native HTML attributes) |
| quoted strings | Complex TypeScript types are preserved verbatim, quoted |

### Tokens

One design token per line — every CSS custom property (`--*`) and class selector the extractor found, across all configured token files. No bullets, no grouping; read whole.

```
--control-medium-paddingInline-normal
--control-medium-size
--overlay-width-large
--spinner-strokeWidth-default
```

## Related

- Configure what gets extracted in [`config.md`](./config.md) (`packages` and `tokens`).
- The extracted facts are the vocabulary that [`knowledge.md`](./knowledge.md) maps scenarios onto and [`wisdom.md`](./wisdom.md) tags rules against.
