> *This example uses GitHub Primer (`@primer/react`) as a reference design system to demonstrate pastiche. It is not affiliated with, endorsed by, or sponsored by GitHub. Primer is a trademark of GitHub, Inc. All Primer atom names, tokens, and component shapes appearing in this example or in **KNOWLEDGE.md** / **WISDOM.md** are property of GitHub, Inc.*

<!-- WISDOM — atom-intrinsic rules. Hand-curated. -->
<!-- Format: `- [Tag1,Tag2,...] rule text.` (comma-separated tags inside one bracket pair). -->
<!-- Tags must match FACT.md atom names verbatim. `[GENERAL]` is the lone non-FACT tag — system-wide invariants. -->
<!-- Discipline: only atom-intrinsic rules here. Scenario-conditional rules belong in KNOWLEDGE. -->

- [GENERAL] Never use raw hex, rgb, or px values; always reference Primer design tokens (`--fgColor-*`, `--bgColor-*`, `--borderColor-*`, `--shadow-*`).
- [GENERAL] No arbitrary gap or padding values; use Stack's gap scale (`none`, `tight`, `condensed`, `cozy`, `normal`, `spacious`) or Primer spacing tokens.
- [GENERAL] No arbitrary media queries; use Primer's viewport ranges (narrow <768px, regular ≥768px, wide ≥1400px) or named breakpoints (xsmall–xxlarge).
- [GENERAL] Contrast ratios (4.5:1 text, 3:1 non-text), focus-visible on all interactive elements, semantic HTML by default, `aria-label` on every icon-only control.
- [GENERAL] `Box` is not exported from `@primer/react`. For generic containers needing Primer token styling, use a plain HTML element (`div`, `section`, etc.) with `style` referencing Primer CSS custom properties, or use `Stack` when flex layout with gap is needed.
- [GENERAL] Always wrap rendered text in the appropriate typographic component — `Text` for body and inline text, `Heading` (with the correct `as` prop for h1–h6) for heading-level text. Never place raw strings directly inside layout or interactive components; the typographic component establishes its own context (size, weight, color), preventing unintended inheritance.
- [Button] Never render more than one variant="primary" Button in a single button group or page region. Primary is the single highest-priority action.
- [Dialog] Before using size="xlarge" (640px), consider whether the content belongs on a separate page. Dialogs are for transient content, not full workflows.
- [IconButton] Always provide aria-label describing the button's action. IconButton has no visible text — the label is the only accessible name.
- [NavList] Never substitute TreeView for NavList when building navigation. TreeView is for hierarchical data display, not page navigation — it uses different ARIA roles and keyboard patterns.
- [FormControl] Never disable or hide the submit button, even when the form is invalid. Disabled buttons break keyboard navigation and leave users without feedback on what went wrong.
- [Stack] When composing a page's top-level sections (page header, filters, content list, pagination), wrap them in a vertical Stack with a named gap (typically `normal` or `spacious`). Never rely on components' intrinsic margins alone for inter-section spacing — Primer components render flush by default.
