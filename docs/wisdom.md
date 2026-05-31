# WISDOM.md

Rules that are always true about a component (or the whole system) — the conventions and constraints that can't be read off the types. Hand-written.

## Why it exists

FACT.md says a `Button` has a `variant` prop. It can't say *"never put two `variant="primary"` buttons in one region."* That rule is real, it matters, and it lives nowhere in the type system. WISDOM.md is where it lives.

These are the **uncodifiable rules** — general invariants and component-specific ones alike — that a senior engineer would enforce in review.

| Who/what | How it uses WISDOM.md |
|---|---|
| The **implementer** agent | Loads every `[GENERAL]` rule, plus the rules tagged for the atoms it's using. Treats them as constraints, not suggestions. |
| The **reviewer** agent | Raises doubts when generated code violates a loaded rule. |
| **You** | Seed `[GENERAL]` rules during `/pastiche-setup`; add rules one at a time via `/pastiche-write-wisdom`. Hand-edit freely. |

## Format

One rule per line: a tag bracket, then the rule text.

```markdown
- [GENERAL] Never use raw hex, rgb, or px values; always reference design tokens.
- [Button] Never render more than one variant="primary" Button in a single region.
- [IconButton] Always provide aria-label — it's the only accessible name.
- [Heading,Text] Choose sizes from one unified scale: Heading large (2rem) → … → Text small (0.75rem).
- [ActionMenu.Button] Renders its own trailing caret — don't pass an explicit one, or it doubles.
```

Tag rules:

| Rule | Detail |
|---|---|
| Match FACT verbatim | Atom tags must equal a FACT.md atom name exactly |
| `[GENERAL]` | The one allowed non-FACT tag — system-wide invariants (tokens, a11y, spacing) |
| Multiple tags | comma-separated inside **one** bracket pair: `[Heading,Text]` — the rule applies to all of them |
| Compound atoms | sub-component names are fine: `[SplitPageLayout.Sidebar]`, `[ActionMenu.Button]` |

## The discipline: WISDOM vs KNOWLEDGE

This is the line adopters most often blur. A rule belongs in WISDOM only if it is **intrinsic** — true of the atom every time it's used, regardless of context.

| Belongs in WISDOM (intrinsic) | Belongs in KNOWLEDGE (scenario-conditional) |
|---|---|
| `[IconButton]` always needs `aria-label` | "For a kebab menu trigger, use `IconButton`" |
| `[Button]` one primary per region | "For the page's main CTA, use `Button variant="primary"`" |
| `[GENERAL]` never use raw px | "For a settings form, use `FormControl` + `TextInput`" |

Litmus test: if the rule starts with *"when building X…"* it's a scenario — put it in [`knowledge.md`](./knowledge.md). If it's *"this atom always…"* it's WISDOM.

## Related

- Tags must match atoms in [`fact.md`](./fact.md).
- Scenario→atom choices live in [`knowledge.md`](./knowledge.md).
