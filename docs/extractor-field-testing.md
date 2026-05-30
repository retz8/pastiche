# FACT extractor — field-testing record (Phase 7 / task 7.1)

Stress-test of `scripts/extract-fact-ts.ts` against three real design-system
codebases across the full `config.yaml` scenario space. Method and acceptance
bar: `docs/spec/phase-7-extractor-field-testing.md`.

## Test codebases

| Library | Mode | Notes |
| --- | --- | --- |
| `@mui/material` | `types` | aggregate `index.d.ts` barrel + per-component `.d.ts`; deep generics, slot/own-props helpers |
| `@mantine/core` | `types` | tiny `lib/index.d.ts` re-export barrel; polymorphic components; compound (`Avatar.Group`) exports |
| shadcn/ui (new-york-v4) | `source_dir` | Radix-based copy-paste `.tsx`; cva variant functions; heavy namespacing |

Reproduce: `scripts/field-test/README.md` (ephemeral installs under
`scripts/field-test/workspace/`, gitignored). Runner: `scripts/field-test/run.sh`.

## Scenario pass-matrix

Tier 0 = ran to completion, wrote FACT.md, no crash. Tier 1 = no silent
omission of a public component (spot-checked against each library's public
component list). Both are hard gates; both pass on all seven scenarios.

| # | Scenario (config) | Composition | Tokens | Components | Tier 0 | Tier 1 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `s1-mui-zero-tokens` | single `types` (MUI) | 0 | 296 | PASS | PASS |
| 2 | `s2-mantine-one-token` | single `types` (Mantine) | 1 | 300 | PASS | PASS |
| 3 | `s3-shadcn-source-dir` | single `source_dir` (shadcn ui) | 1 | 303 | PASS | PASS |
| 4 | `s4-mui-mantine-multi-types` | multiple `types` (MUI + Mantine) | 0 | 552 | PASS | PASS |
| 5 | `s5-shadcn-multi-source-dir` | multiple `source_dir` (shadcn ui + charts) | 1 | 373 | PASS | PASS |
| 6 | `s6-mui-shadcn-mixed` | mixed `types` + `source_dir` (MUI + shadcn ui) | 1 | 563 | PASS | PASS |
| 7 | `s7-multi-dts-types-list` | single package, multiple `.d.ts` (`types:` list) | 0 | 12 | PASS | PASS |

Tier-1 spot-check method per library:
- MUI — `export { default as X }` set (137 public). The 7 not emitted
  (`useMediaQuery`, `useScrollTrigger`, `useAutocomplete`, `generateUtilityClass`,
  `generateUtilityClasses`, `unstable_composeClasses`, `darkScrollbar`) are hooks
  and utility functions, not components. No component omitted.
- Mantine — top-level `lib/components/*` directories (110). All 110 present.
- shadcn — every `ui/*.tsx` file carries a standard named export; all captured.
  Apparent misses (`Direction`, `Variants`, `ListVariants`) are a radix namespace
  import and cva variant functions, not components.
- Scenario 7 — the four intended components (`Button`, `TextField`, `Dialog`,
  `Card`) all present.

## Per-gap log

### Gap 1 — cross-package flat/dotted silent omission  *(Tier 1 · fixed)*

- **Surfaced by:** scenario 4 (MUI + Mantine multi-types).
- **Construct:** MUI exports the flat `AvatarGroup`/`ButtonGroup`/`InputLabel`;
  Mantine exports the compound `Avatar.Group`/`Button.Group`/`Input.Label`.
- **Flavor:** silent omission. Before the fix, the composite dropped MUI's
  `AvatarGroup`, `ButtonGroup`, `InputLabel` entirely (549 → present-minus-3),
  with no warning.
- **Root cause:** `dedupeComponents`' flat/dotted subsumption pass
  (`ActionList.Item` subsumes `ActionListItem`) was package-blind. It treated
  Mantine's `Avatar.Group` and MUI's flat `AvatarGroup` as the same atom and
  deleted the flat one. The flat/dotted pair is only ever an *intra-library*
  artifact; across packages the two names are distinct components.
- **Distilled test:** `dedupeComponents does not subsume a flat name across
  packages` (and the companion `... subsumes a flat name under a same-package
  dotted compound`, which pins the in-library behavior so the fix can't regress
  it) in `scripts/extract-fact-ts.test.ts`.
- **Resolution:** fixed — guard the subsumption with `dotComp.pkg ===
  flatComp.pkg`. Composite now emits both forms (scenario 4: 549 → 552, zero MUI
  omissions). Cross-package *same-name* collisions remain governed by the
  existing warn-and-keep-first policy (out of scope per spec §Scope).

### Gap 2 — `*Props` helper interfaces promoted to component atoms  *(Tier 3 · documented limitation)*

- **Surfaced by:** scenario 7 (and inflates MUI's count in scenarios 1/4/6).
- **Construct:** MUI's per-component barrels export prop-shape helper
  interfaces — `ButtonOwnProps`, `CardOwnProps`, `TextFieldSlotsAndSlotProps`,
  `DialogSlotsAndSlotProps`, `BaseTextFieldProps`, `StandardTextFieldProps`,
  `FilledTextFieldProps`, `OutlinedTextFieldProps`. The extractor strips the
  `Props` suffix and emits each as a component atom (`ButtonOwn`, `CardOwn`,
  `TextFieldSlotsAndSlot`, …).
- **Flavor:** noise / over-capture. No real component is shadowed (the genuine
  `Button`/`Card`/`TextField`/`Dialog` atoms are emitted separately), so this is
  not a Tier-1 omission.
- **Root cause:** `discoverComponents` candidate branch (a) treats every
  exported `XxxProps` type as evidence of a component `Xxx`, regardless of
  whether a `Xxx` component *value* exists. That branch is a deliberate safety
  net: it rescues components whose value export is not locally resolvable
  (re-exported from elsewhere) but whose `Props` type is visible.
- **Resolution:** documented limitation, not fixed. Distinguishing a helper
  `*Props` interface from a real component's `*Props` without a locally-resolved
  value would require library-specific name patterns (`*OwnProps`,
  `*SlotsAndSlotProps`), which is fragile and risks re-introducing Tier-1
  omissions by suppressing the safety net. Extractor backlog.

### Gap 3 — HTML-attribute over-expansion  *(Tier 3 · documented limitation)*

- **Surfaced by:** scenario 7 (`TextField`, `StandardTextField`, …).
- **Construct:** components whose props extend a fully-resolved HTML element
  attributes interface (MUI's `StandardProps<FormControlProps, …>`) expand to
  the entire DOM + ARIA + event-handler attribute surface (~300 prop lines per
  atom).
- **Flavor:** noise / over-capture. The expanded props are technically valid but
  drown the component-specific props.
- **Root cause:** interface expansion follows `extends`/spread chains into the
  React DOM attribute base interfaces when they resolve within the package's
  type graph.
- **Resolution:** documented limitation, not fixed. The expanded props are real;
  suppressing the DOM-attribute base would need a denylist of known ambient
  React/DOM interfaces. Extractor backlog.

## Known limitations carried forward

- Gaps 2 and 3 above (over-capture noise) — extractor backlog, not adopter
  patches.
- Cross-package *same-name* collisions are resolved by warn-and-keep-first; the
  warning may repeat once per re-exporting source file. Out of scope for 7.1.
