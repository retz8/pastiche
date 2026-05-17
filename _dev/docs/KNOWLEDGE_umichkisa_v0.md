<!-- Scenario → atom mappings. Hand-curated by designers + frontend engineers. -->
<!-- Discipline: only scenario-conditional knowledge here. Atom-intrinsic rules belong in WISDOM. -->

## Index

The 12 canonical sections — required by every KNOWLEDGE.md (may be empty stubs). Implementer reads this index first, then loads only the sections relevant to the task. Order is by frequency of consultation, not priority.

- **Action buttons** — primary, secondary, low-emphasis, destructive, icon-only, anchor-styled, list-row, sticky dock.
- **Forms & input collection** — text inputs, choices, multi-select, toggles, dates inside a form, submit/cancel, validation patterns.
- **Feedback & status** — inline messages, alerts, toasts, full-page status, loading indicators, content placeholders.
- **Overlays** — modals, drawers, popovers, tooltips, confirmations, mobile sheets, contextual menus.
- **Navigation & wayfinding** — section switchers, tabs, filters, breadcrumbs, pagination, progressive disclosure.
- **Content display** — cards, lists, grids, tables, badges, labels.
- **Layout & page structure** — containers, section grouping, dividers, page shell.
- **Date & time selection** — pickers, ranges, time-of-day, calendar surfaces.
- **Iconography** — icon usage, sizing, decorative vs informative.
- **Visual hierarchy** — heading ramps, type pairings, content density, emphasis.
- **Domain-specific patterns** — KISA app surfaces unique to this codebase (e.g., pocha, banquet RSVP). Project-extension lives here.
- **Brand Identity** — prose. Always-loaded by implementer regardless of task.

## Action buttons

### Primary action / main CTA
Submit a form, confirm a modal, advance a flow. The dominant action on the surface.
→ `Button variant="primary"`

### Secondary action
Cancel, "Back", alternative path alongside a primary. Lower visual weight than primary.
→ `Button variant="secondary"`

### Low-emphasis inline action
Action embedded in dense UI (table rows, list headers) that should not compete with surrounding content.
→ `Button variant="tertiary"`

### Destructive action
Delete, remove, irreversible state change. Always paired with a confirmation step (see Overlays).
→ `Button variant="destructive"`

### Icon-only action
Close, edit, more-menu, toolbar action where text would be redundant or space-constrained.
→ `IconButton` with `aria-label` (optional `Tooltip` matching the label when the icon's meaning isn't obvious)

### Anchor styled as a button
External link, navigation that visually presents as a CTA, link inside a button-shaped slot.
→ `LinkButton`

### Tappable list row / selection trigger
A full-width row in a list that opens a detail view, sheet, or selects an item — menu list item, picker row, navigable record. Not an action-class CTA.
→ `Button variant="tertiary"` with `className="w-full justify-start"` (composes the row layout — image, text, price — as children); rely on Button's built-in hover/focus/disabled states rather than hand-rolling them on a raw `<button>`

### Page-bottom CTA dock / sticky bottom action bar
A persistent action bar pinned to the viewport bottom on mobile flows — checkout "View Cart", "Proceed to payment", mobile primary action. One CTA per dock.
→ `Button variant="primary"` (full-width, `w-full`) wrapped in a fixed-position container: `<div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>`. The wrapper is the dock; the `Button` is the action.

## Forms & input collection

### Single-line text input in a form
Names, emails, short answers, search queries inside a form.
→ `Form.Input`

### Multi-line / long-form text
Free-form descriptions, comments, message bodies.
→ `Form.Textarea`

### Single choice from many (compact)
One-of-N selection where space is constrained or the option set is long.
→ `Form.Select`

### Single choice from few (visible)
One-of-N where seeing all options at once aids the decision (typically ≤ 5).
→ `Form.Radio`

### Multi-select from a list
Zero-or-more selection from a list of options.
→ `Form.Checkbox`

### Boolean preference / setting toggle
On/off, enabled/disabled — a binary state read at a glance.
→ `Form.Switch`

### Date input inside a form
Single date as a form field (deadline, birthdate, event date).
→ `Form.DatePicker`

### Date range inside a form
Start + end date as a single form field.
→ `Form.DateRangePicker`

### Form submit / cancel
Submit button or cancel button living inside a form's action row.
→ `Form.Button` (primary for submit, secondary for cancel)

### Stateful form requiring validation
Any form that collects, validates, and submits user input.
→ `Form` (from `@umichkisa-ds/form`) wrapping `Form.*` field compounds

## Feedback & status

### Inline status message (success / warning / error / info)
A status banner that lives within page flow — form-level error summary, post-action confirmation, advisory note.
→ `Alert variant="success|warning|error|info"`

### Full-page status surface
Page-level not-found, not-authorized, not-logged-in, or error state replacing the entire surface.
→ `StatusView variant="not-found|not-authorized|not-logged-in|error"` (`fullScreen` when it owns the viewport)

### Transient confirmation of an action
Brief, dismiss-itself feedback after a user action — "Saved", "Copied", "Deleted".
→ `toast()` from `@umichkisa-ds/web` (with `Toaster` mounted once at app root)

### Status label on an entity
Compact status mark on a row, card, or list item — "available", "pending review", "expired".
→ `Badge variant="success|warning|error|info"`

### Categorical / non-status label
Tag, category, generic descriptor — content type, topic, neutral attribute.
→ `Badge` (default variant)

### In-flight indicator (small region)
A spinner inside a button, table cell, or card while data loads.
→ `LoadingSpinner`

### Content placeholder while loading
Layout-preserving placeholder for cards, lists, tables before data arrives.
→ `Skeleton`

## Overlays

### Destructive confirmation
Confirming an irreversible action — delete, revoke, archive.
→ `Dialog` containing primary `Button variant="destructive"` + secondary `Button variant="secondary"` (Cancel)

### Modal flow / focused task
A task that needs the user's full attention away from the page — edit form, multi-step picker, detail view.
→ `Dialog`

### Contextual menu (action list)
A list of actions launched from a trigger — row "more" menu, user menu, sort/filter selector.
→ `Dropdown`

### Contextual rich content on click
Larger interactive content surfaced from a trigger — filter panel, mini calendar, info card with controls.
→ `Popover`

### Hover hint / brief label
Short label clarifying an icon button or truncated text on hover/focus. Not for interactive content.
→ `Tooltip`

### Mobile bottom-sheet overlay
Mobile detail panel, mobile picker/selector, mobile order/receipt view.
→ `Sheet` (+ `SheetTrigger`, `SheetContent`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`)

## Navigation & wayfinding

### Page-level section switcher
Switching between top-level views of a page or feature — "Overview / Members / Settings".
→ `Tabs` (+ `TabsList`, `TabsTrigger`, `TabsContent`)

### Compact filter / view toggle
Mutually exclusive view options living inline with content — "All / Active / Archived", "Day / Week / Month".
→ `ToggleGroup`

### Progressively revealed content
Long-form content broken into collapsible sections — FAQ, settings groups, "details" toggles.
→ `Accordion`

### Paged list navigation
Stepping through a long list of records — table pagination, search results, archive.
→ `Pagination`

## Content display

### Tabular data
Records with shared columns — admin lists, registries, structured datasets.
→ `Table` (with `TableMobileList` for the small-screen fallback)

### Summary card / key-value surface
A bounded surface grouping a title, supporting text, and content — entity summaries, dashboard tiles.
→ `Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)

### Section break inside a flowing surface
A horizontal rule separating logical groups within a card, list, or page region.
→ `Divider`

### User identity mark
Avatar mark for a person, organization, or account — header, comment, member list.
→ `Avatar`

## Layout & page structure

### Page shell / outer page wrapper
The outermost wrapper enforcing page width, gutter, and responsive padding.
→ `Container` (one per page region — never nested)

### Multi-column responsive layout
Side-by-side content that collapses on narrow viewports — card grids, two-column form sections, dashboard tiles.
→ `Grid`

### Vertical rhythm between elements
Stacking siblings with consistent spacing.
→ `gap-2` (Element / 8px — icon+text, button+icon, inline groups)
→ `gap-4` (Component / 16px — sibling components inside a feature, form fields, list items)
→ `gap-6` (Section / 24px — boundaries between major page sections)

## Date & time selection

### Standalone single date picker (outside a form)
A date trigger that opens a calendar — filter control, ad-hoc date selection.
→ `DatePicker`

### Standalone date range picker (outside a form)
Start + end date selection outside a form — analytics range, schedule filter.
→ `DateRangePicker`

### Inline calendar / month grid
A calendar surface rendered in place — schedule view, multi-date highlight, custom date interaction.
→ `Calendar`

## Visual hierarchy

### Primary readable content
Body paragraphs, card values, list labels, form labels, headings — anything the user is meant to read.
→ `text-foreground`

### Genuinely secondary content
Captions, helper text, metadata, timestamps, placeholder hints. Test: at 40% opacity, would the screen still be usable? If no, it's primary, not secondary.
→ `text-muted-foreground`

### Disabled text
Text inside a disabled control or unavailable affordance.
→ `text-disabled-foreground`

### Hyperlink in body content
Inline link inside a paragraph or label.
→ `text-link`

### Error / destructive text
Inline error messages, validation feedback, destructive-action labels in body content.
→ `text-error`

### Default surface (card, panel)
Bounded surface holding grouped content.
→ `bg-surface`

### Subtle surface (nested or muted block)
A backgrounded region that should sit quieter than the default surface — info block, sidebar tile.
→ `bg-surface-subtle`

### Brand emphasis surface (selected / active state)
A surface marked with brand presence — selected list item, brand callout.
→ `bg-brand-accent-subtle` with `border-brand-primary` (full ring, not a left-border accent)

### Strong brand surface (CTA backgrounds, hero blocks)
Heavy brand presence — CTA backgrounds, hero blocks, brand banner.
→ `bg-brand-primary` or `bg-brand-accent`

### Default border between regions
Standard separation between surfaces, inputs, cards.
→ `border-border`

### Emphasized border
Border that should read more present — focused state, important separation.
→ `border-border-strong`

### Display / hero typography
Page hero, marketing display lines.
→ `type-display`

### Dual-line page hero (EN title + KR subtitle)
Standard kisa-web page hero pattern — English display title with a Korean subtitle line beneath. Both lines render at full foreground intensity (the KR line is a co-equal brand label, not de-emphasized metadata).
→ `<header className="flex flex-col gap-2">` containing `<h1 className="type-h1">{en}</h1>` + `<p className="type-body text-foreground">{kr}</p>`. Reference: `InfoOverviewTemplate`, `/info/checklist`.

### Headings
Section headings in descending hierarchy.
→ `type-h1` / `type-h2` / `type-h3`

### Body copy
Default reading text. Use compact variant in dense surfaces (table cells, side panels).
→ `type-body` (default) / `type-body-sm` (compact)

### Form / button label
Labels on form fields, button captions, small UI labels.
→ `type-label`

### Caption / fine print
Metadata, timestamps, footnotes.
→ `type-caption`

### Radius — default control / surface
Buttons, inputs, cards.
→ `rounded-md`

### Radius — larger surface
Modals, larger panels.
→ `rounded-lg`

### Radius — pill / circular
Avatars, pills, fully-rounded chips.
→ `rounded-full`

## Iconography

### Any icon in the UI
Any iconographic mark — leading/trailing in a label, inline with text, decorative accent, status indicator.
→ `Icon name="..."` from `@umichkisa-ds/web`, size from the 5-step scale (`xs`/`sm`/`md`/`lg`/`xl`)

---

## Domain-specific patterns

App-unique scenarios that don't fit the general taxonomy. Empty until KISA codifies a pattern that's specific enough to deserve its own scenario→atom mapping (e.g., pocha menu management, banquet RSVP). Implementer falls back to raw HTML/Tailwind for novel domain surfaces until a mapping is added here.

---

## Brand Identity

KISA is the **Korean International Student Association** at the University of Michigan — a member-facing hub to promot Korean Student communities around the campus. It is informational and social, never promotional. The palette defaults to black with **maize as the accent, navy reaching in where brand presence is wanted**; no third color, no drop-shadow ornament. Typography is **SejongHospital Bold for display and headings, Pretendard Variable for the rest** — Korean-first across most surfaces, but English default if needed based on app's feature. Microcopy sits in **존댓말, neutral-functional**: bare verb-noun forms on controls (`지원하기`, `마감`), function-described over user-addressed in copy, no exclamation marks, no encouragement, no emoji. The visual grammar holds across all surfaces; content density and microcopy warmth flex, the design language does not.
