<!-- KNOWLEDGE — scenario → atom mappings. Hand-curated. -->
<!-- Per scenario: prose framing line(s), then one or more `→ <atom expression>` lines. -->
<!-- Atom names backticked (e.g. `Button`, `gap-4`, `Form.Input`); prop expressions bare. -->
<!-- Multi-arrow scenarios allowed; LLM parses scenario boundaries semantically. -->
<!-- All 12 H2 sections required (lint enforces). Empty stubs are OK. -->

## Action buttons

Submit a form, confirm a modal, advance a flow. The dominant action on the surface.
→ `Button` variant="primary"

Cancel, "Back", alternative path alongside a primary. Lower visual weight than primary.
→ `Button` variant="secondary"

Action embedded in dense UI (table rows, list headers) that should not compete with surrounding content.
→ `Button` variant="tertiary"

Delete, remove, irreversible state change. Always paired with a confirmation step (see Overlays).
→ `Button` variant="destructive"

Close, edit, more-menu, toolbar action where text would be redundant or space-constrained.
→ `IconButton` with aria-label (optional `Tooltip` matching the label when the icon's meaning isn't obvious)

External link, navigation that visually presents as a CTA, link inside a button-shaped slot.
→ `LinkButton`

A full-width row in a list that opens a detail view, sheet, or selects an item — menu list item, picker row, navigable record. Not an action-class CTA.
→ `Button` variant="tertiary" className="w-full justify-start" (composes the row layout — image, text, price — as children); rely on Button's built-in hover/focus/disabled states rather than hand-rolling them on a raw <button>

A persistent action bar pinned to the viewport bottom on mobile flows — checkout "View Cart", "Proceed to payment", mobile primary action. One CTA per dock.
→ `Button` variant="primary" (full-width, w-full) wrapped in a fixed-position container: <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>. The wrapper is the dock; the Button is the action.

## Forms & input collection

Names, emails, short answers, search queries inside a form.
→ `Form.Input`

Free-form descriptions, comments, message bodies.
→ `Form.Textarea`

One-of-N selection where space is constrained or the option set is long.
→ `Form.Select`

One-of-N where seeing all options at once aids the decision (typically ≤ 5).
→ `Form.Radio`

Zero-or-more selection from a list of options.
→ `Form.Checkbox`

On/off, enabled/disabled — a binary state read at a glance.
→ `Form.Switch`

Single date as a form field (deadline, birthdate, event date).
→ `Form.DatePicker`

Start + end date as a single form field.
→ `Form.DateRangePicker`

Submit button or cancel button living inside a form's action row.
→ `Form.Button` (primary for submit, secondary for cancel)

Any form that collects, validates, and submits user input.
→ `Form` (from @umichkisa-ds/form) wrapping `Form.*` field compounds

## Feedback & status

A status banner that lives within page flow — form-level error summary, post-action confirmation, advisory note.
→ `Alert` variant="success|warning|error|info"

Page-level not-found, not-authorized, not-logged-in, or error state replacing the entire surface.
→ `StatusView` variant="not-found|not-authorized|not-logged-in|error" (fullScreen when it owns the viewport)

Brief, dismiss-itself feedback after a user action — "Saved", "Copied", "Deleted".
→ toast() from @umichkisa-ds/web (with `Toaster` mounted once at app root)

Compact status mark on a row, card, or list item — "available", "pending review", "expired".
→ `Badge` variant="success|warning|error|info"

Tag, category, generic descriptor — content type, topic, neutral attribute.
→ `Badge` (default variant)

A spinner inside a button, table cell, or card while data loads.
→ `LoadingSpinner`

Layout-preserving placeholder for cards, lists, tables before data arrives.
→ `Skeleton`

## Overlays

Confirming an irreversible action — delete, revoke, archive.
→ `Dialog` containing primary `Button` variant="destructive" + secondary `Button` variant="secondary" (Cancel)

A task that needs the user's full attention away from the page — edit form, multi-step picker, detail view.
→ `Dialog`

A list of actions launched from a trigger — row "more" menu, user menu, sort/filter selector.
→ `Dropdown`

Larger interactive content surfaced from a trigger — filter panel, mini calendar, info card with controls.
→ `Popover`

Short label clarifying an icon button or truncated text on hover/focus. Not for interactive content.
→ `Tooltip`

Mobile detail panel, mobile picker/selector, mobile order/receipt view.
→ `Sheet` (+ `SheetTrigger`, `SheetContent`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`)

## Navigation & wayfinding

Switching between top-level views of a page or feature — "Overview / Members / Settings".
→ `Tabs` (+ `TabsList`, `TabsTrigger`, `TabsContent`)

Mutually exclusive view options living inline with content — "All / Active / Archived", "Day / Week / Month".
→ `ToggleGroup`

Long-form content broken into collapsible sections — FAQ, settings groups, "details" toggles.
→ `Accordion`

Stepping through a long list of records — table pagination, search results, archive.
→ `Pagination`

## Content display

Records with shared columns — admin lists, registries, structured datasets.
→ `Table` (with `TableMobileList` for the small-screen fallback)

A bounded surface grouping a title, supporting text, and content — entity summaries, dashboard tiles.
→ `Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)

A horizontal rule separating logical groups within a card, list, or page region.
→ `Divider`

Avatar mark for a person, organization, or account — header, comment, member list.
→ `Avatar`

## Layout & page structure

The outermost wrapper enforcing page width, gutter, and responsive padding.
→ `Container` (one per page region — never nested)

Side-by-side content that collapses on narrow viewports — card grids, two-column form sections, dashboard tiles.
→ `Grid`

Stacking siblings with consistent spacing.
→ `gap-2` (Element / 8px — icon+text, button+icon, inline groups)
→ `gap-4` (Component / 16px — sibling components inside a feature, form fields, list items)
→ `gap-6` (Section / 24px — boundaries between major page sections)

## Date & time selection

A date trigger that opens a calendar — filter control, ad-hoc date selection.
→ `DatePicker`

Start + end date selection outside a form — analytics range, schedule filter.
→ `DateRangePicker`

A calendar surface rendered in place — schedule view, multi-date highlight, custom date interaction.
→ `Calendar`

## Iconography

Any iconographic mark — leading/trailing in a label, inline with text, decorative accent, status indicator.
→ `Icon` name="..." from @umichkisa-ds/web, size from the 5-step scale (xs/sm/md/lg/xl)

## Visual hierarchy

Body paragraphs, card values, list labels, form labels, headings — anything the user is meant to read.
→ `text-foreground`

Captions, helper text, metadata, timestamps, placeholder hints. Test: at 40% opacity, would the screen still be usable? If no, it's primary, not secondary.
→ `text-muted-foreground`

Text inside a disabled control or unavailable affordance.
→ `text-disabled-foreground`

Inline link inside a paragraph or label.
→ `text-link`

Inline error messages, validation feedback, destructive-action labels in body content.
→ `text-error`

Bounded surface holding grouped content.
→ `bg-surface`

A backgrounded region that should sit quieter than the default surface — info block, sidebar tile.
→ `bg-surface-subtle`

A surface marked with brand presence — selected list item, brand callout.
→ `bg-brand-accent-subtle` with `border-brand-primary` (full ring, not a left-border accent)

Heavy brand presence — CTA backgrounds, hero blocks, brand banner.
→ `bg-brand-primary` or `bg-brand-accent`

Standard separation between surfaces, inputs, cards.
→ `border-border`

Border that should read more present — focused state, important separation.
→ `border-border-strong`

Page hero, marketing display lines.
→ `type-display`

Standard kisa-web page hero pattern — English display title with a Korean subtitle line beneath. Both lines render at full foreground intensity (the KR line is a co-equal brand label, not de-emphasized metadata).
→ <header className="flex flex-col gap-2"> containing <h1 className="type-h1">{en}</h1> + <p className="type-body text-foreground">{kr}</p>. Reference: InfoOverviewTemplate, /info/checklist.

Section headings in descending hierarchy.
→ `type-h1` / `type-h2` / `type-h3`

Default reading text. Use compact variant in dense surfaces (table cells, side panels).
→ `type-body` (default) / `type-body-sm` (compact)

Labels on form fields, button captions, small UI labels.
→ `type-label`

Metadata, timestamps, footnotes.
→ `type-caption`

Buttons, inputs, cards.
→ `rounded-md`

Modals, larger panels.
→ `rounded-lg`

Avatars, pills, fully-rounded chips.
→ `rounded-full`

## Domain-specific patterns

App-unique scenarios that don't fit the general taxonomy. Empty until KISA codifies a pattern that's specific enough to deserve its own scenario→atom mapping (e.g., pocha menu management, banquet RSVP). Implementer falls back to raw HTML/Tailwind for novel domain surfaces until a mapping is added here.

## Brand Identity

KISA is the **Korean International Student Association** at the University of Michigan — a member-facing hub to promot Korean Student communities around the campus. It is informational and social, never promotional. The palette defaults to black with **maize as the accent, navy reaching in where brand presence is wanted**; no third color, no drop-shadow ornament. Typography is **SejongHospital Bold for display and headings, Pretendard Variable for the rest** — Korean-first across most surfaces, but English default if needed based on app's feature. Microcopy sits in **존댓말, neutral-functional**: bare verb-noun forms on controls (`지원하기`, `마감`), function-described over user-addressed in copy, no exclamation marks, no encouragement, no emoji. The visual grammar holds across all surfaces; content density and microcopy warmth flex, the design language does not.
