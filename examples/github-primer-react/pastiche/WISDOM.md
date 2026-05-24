<!-- WISDOM — atom-intrinsic rules. Hand-curated. -->
<!-- Format: `- [Tag1,Tag2,...] rule text.` (comma-separated tags inside one bracket pair). -->
<!-- Tags must match FACT.md atom names verbatim. `[GENERAL]` is the lone non-FACT tag — system-wide invariants. -->
<!-- Discipline: only atom-intrinsic rules here. Scenario-conditional rules belong in KNOWLEDGE. -->

- [GENERAL] Never use raw hex, rgb, or px values; always reference Primer design tokens (`--fgColor-*`, `--bgColor-*`, `--borderColor-*`, `--shadow-*`).
- [GENERAL] No arbitrary gap or padding values; use Stack's gap scale (`none`, `tight`, `condensed`, `cozy`, `normal`, `spacious`) or Primer spacing tokens.
- [GENERAL] No arbitrary media queries; use Primer's viewport ranges (narrow <768px, regular ≥768px, wide ≥1400px) or named breakpoints (xsmall–xxlarge).
- [GENERAL] Contrast ratios (4.5:1 text, 3:1 non-text), focus-visible on all interactive elements, semantic HTML by default, `aria-label` on every icon-only control.
- [Button] Never render more than one variant="primary" Button in a single button group or page region. Primary is the single highest-priority action.
- [Dialog] Before using size="xlarge" (640px), consider whether the content belongs on a separate page. Dialogs are for transient content, not full workflows.
- [IconButton] Always provide aria-label describing the button's action. IconButton has no visible text — the label is the only accessible name.
- [NavList] Never substitute TreeView for NavList when building navigation. TreeView is for hierarchical data display, not page navigation — it uses different ARIA roles and keyboard patterns.
- [FormControl] Never disable or hide the submit button, even when the form is invalid. Disabled buttons break keyboard navigation and leave users without feedback on what went wrong.
