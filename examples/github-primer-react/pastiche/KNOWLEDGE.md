<!-- KNOWLEDGE — scenario → atom mappings. Hand-curated. -->
<!-- Per scenario: prose framing line(s), then one or more `→ <atom expression>` lines. -->
<!-- Atom names backticked — FACT entries verbatim. Never derived utility forms or untracked Tailwind (those belong as WISDOM `[GENERAL]` rules). Prop expressions bare. -->
<!-- Multi-arrow scenarios allowed; LLM parses scenario boundaries semantically. -->
<!-- All 12 H2 sections required (lint enforces). Empty stubs are OK. -->

## Action buttons

Primary call-to-action on a page — the single most important action the user should take.
→ `Button` variant="primary"

Destructive action that requires confirmation before proceeding (e.g., delete, close permanently).
→ `Button` variant="danger"
→ `ConfirmationDialog` confirmButtonType="danger"

Secondary / alternative path — supporting actions alongside the primary CTA (e.g., "Cancel", "Save as draft").
→ `Button` variant="default"

De-emphasized action — actions that should be present but visually quiet (e.g., "Edit", "Copy link" inline).
→ `Button` variant="invisible"

Loading state — button that reflects an in-progress async operation, disabling re-submission.
→ `Button` loading={true} loadingAnnouncement="…"

Icon-only action — compact action where the icon alone is sufficient (e.g., kebab menu trigger, close button). Requires an accessible label.
→ `IconButton` icon={…} aria-label="…"

Link-styled navigation — action that navigates to another page but lives in a button context (e.g., "Learn more", "View all").
→ `LinkButton` href="…"

## Forms & input collection

Single-line text field for short-form entry (name, email, URL).
→ `FormControl` + `TextInput`

Longer-form freetext entry (comment, description, bio).
→ `FormControl` + `Textarea` block={true}

Picking one option from a predefined list (country, role, priority).
→ `FormControl` + `Select`

Choosing one option when all choices should be visible (visibility level, notification frequency).
→ `RadioGroup` + `FormControl` + `Radio`

Toggling multiple options on/off (notification preferences, label categories).
→ `CheckboxGroup` + `FormControl` + `Checkbox`

Boolean on/off setting with immediate effect (enable feature, dark mode).
→ `ToggleSwitch` aria-labelledby="…"

Searching and selecting from a large or dynamic set (assignee picker, repo search).
→ `Autocomplete` + `Autocomplete.Input` + `Autocomplete.Menu` + `Autocomplete.Overlay`

Selecting multiple items rendered as dismissible tokens (labels, collaborators).
→ `FormControl` + `TextInputWithTokens`

Picking one or more items from a searchable overlay list (label picker, reviewer picker).
→ `SelectPanel` selectionVariant="multiple"

Showing success or error feedback tied to a specific field.
→ `FormControl.Validation` variant="error"
→ `FormControl.Validation` variant="success"

Wrapping a field with label, required mark, and helper text.
→ `FormControl` required={true} + `FormControl.Label` + `FormControl.Caption`

## Feedback & status

Page-level notification highlighting important information, a warning, or the result of an action.
→ `Banner` variant="info" | "warning" | "critical" | "success"

Localized feedback adjacent to the action that triggered it (e.g., below an input, next to a button).
→ `InlineMessage` variant="critical" | "warning" | "success" | "unavailable"

## Overlays

Modal dialog for transient content — editing, composing, or reviewing information that doesn't warrant a full page.
→ `Dialog`

Confirming a potentially destructive or irreversible user action before proceeding.
→ `ConfirmationDialog` confirmButtonType="danger"

Context menu or dropdown of actions triggered from a button (e.g., kebab "more actions", sort options).
→ `ActionMenu` + `ActionMenu.Button` + `ActionList` + `ActionList.Item`

Tooltip providing a short text hint on hover/focus — supplementary context, not essential information.
→ `Tooltip` text="…" type="description"

Tooltip serving as the accessible name for an icon-only control (replacing a visible label).
→ `Tooltip` text="…" type="label"

Anchored overlay for custom positioned content attached to a trigger element (e.g., a custom picker or rich preview).
→ `AnchoredOverlay` renderAnchor={…}

## Navigation & wayfinding

Vertical sidebar navigation showing the current view and linking to sibling views within a context.
→ `NavList`
→ `NavList.Item` aria-current="page"
→ `NavList.Group`

Horizontal tabbed navigation switching between 2+ related views, where each tab changes the URL.
→ `UnderlineNav`
→ `UnderlineNav.Item` counter

Breadcrumb trail showing the user's location within a nested hierarchy (e.g., Org → Repo → Settings).
→ `Breadcrumbs` + `Breadcrumbs.Item`

Paginated navigation for long lists or search results.
→ `Pagination` pageCount={…} currentPage={…}

Same-page filter toggle with counts (e.g., Open/Closed issue status tabs) — does not change the URL.
→ `SegmentedControl`
→ `SegmentedControl.Button` count leadingIcon

## Content display

Tabular data with sorting, where each row represents an item and columns are data points about it.
→ `DataTable`
→ `Table.Container`
→ `Table.Title`

Displaying the status of an issue or pull request with an icon and color-coded label.
→ `StateLabel` status="open" | "closed" | "merged" | "draft"

Compact label for categorization or metadata (e.g., issue labels, language tags).
→ `Label` variant="default" | "primary" | "secondary" | "accent" | "success" | "attention" | "severe" | "danger" | "done" | "sponsors"

Numeric count badge alongside a tab, nav item, or heading (e.g., "Issues 42").
→ `CounterLabel` scheme="primary" | "secondary"

Hierarchical tree of expandable items (e.g., file browser, directory listing).
→ `TreeView` + `TreeView.Item` + `TreeView.SubTree`

Standalone page-level list where each row is a navigable item with status, title, metadata, and trailing info. Not a menu — this is primary page content rendered directly in the page body, not inside an overlay or ActionMenu.
→ `ActionList` + `ActionList.Item`
→ `ActionList.LeadingVisual`
→ `ActionList.TrailingVisual`
→ `ActionList.Description`

Inline label tags displayed next to text content (e.g., issue title followed by colored labels in a list row).
→ `LabelGroup` to wrap the `Label` set; provides overflow handling via overflowStyle="inline" | "overlay"

## Layout & page structure

Top-level page heading with title, optional description, and action buttons — the entry point of a page.
→ `PageHeader`
→ `PageHeader.Title`
→ `PageHeader.Actions`
→ `PageHeader.Description`

Content page with a metadata or navigation sidebar (issue detail, issue composer, PR detail) — two regions, one content + one pane.
→ `SplitPageLayout` + `SplitPageLayout.Content` + `SplitPageLayout.Pane` position="end"

Full page scaffold needing more than two regions (header, footer, sidebar, content), per-viewport region visibility, or a resizable pane.
→ `PageLayout` + `PageLayout.Header` + `PageLayout.Content` + `PageLayout.Pane` + `PageLayout.Footer`

Vertical or horizontal stacking of elements with consistent gap spacing.
→ `Stack` direction="vertical" | "horizontal" gap="condensed" | "normal" | "spacious"

Global site footer with copyright text and navigation links. All footer content uses 12px text.
→ `Stack` direction="horizontal" gap="normal" wrap="wrap"
→ `Text` style={{ fontSize: 12 }}
→ `Link` muted style={{ fontSize: 12 }}

## Date & time selection

Displaying a timestamp in human-readable relative format that automatically updates (e.g., "3 hours ago", "yesterday").
→ `RelativeTime` threshold="P30D"

## Iconography

Icon-only button in a compact space where the icon's meaning is universally understood (e.g., close, search, settings).
→ `IconButton` aria-label="<descriptive text>" icon={OcticonName}

Decorative icon inside a button or list item that reinforces the adjacent text label — not the sole means of communication.
→ `Button` leadingVisual={OcticonName}
→ `ActionList.LeadingVisual`


## Visual hierarchy

Primary page heading that establishes the top of the content hierarchy.
→ `Heading` as="h1" | "h2"

De-emphasized secondary text that provides supporting context without competing with primary content.
→ `Text` size="small" weight="light"

Rendering longer-form body text or inline content with controlled size and color.
→ `Text` as="p" size="medium"

## Domain-specific patterns

Chronological event history showing a sequence of comments, status changes, and activity on an issue or pull request.
→ `Timeline`
→ `Timeline.Item`
→ `Timeline.Badge`
→ `Timeline.Body`

Empty state placeholder when a list or page has no content yet — guiding the user toward a first action.
→ `Blankslate`
→ `Blankslate.Visual`
→ `Blankslate.Heading`
→ `Blankslate.PrimaryAction`

## Brand Identity

Primer is GitHub's design system — functional, restrained, and engineer-facing. It clarifies rather than decorates. The UI should disappear so the user can focus on their work: code, issues, pull requests, discussions.

Density is moderate: GitHub is a productivity tool where information density matters, but readability always wins. Primer leans toward showing data efficiently without cramming.

Restraint is heavy. One primary button per page. Tooltips are a last resort. If a Primer component exists for the job, use it — no custom CSS, no bespoke solutions. The system limits itself aggressively to maintain consistency at scale.

Accessibility is not a retrofit — it's the starting posture. WCAG 2.2 AA minimum. Every interactive element must be keyboard-accessible, every color choice must meet contrast ratios, every dynamic update must be announced to screen readers.
