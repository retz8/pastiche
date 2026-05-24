# KNOWLEDGE + WISDOM Candidates — Primer Reference Adoption

Copy-pasteable reference for filling KNOWLEDGE.md and WISDOM.md via pastiche skills. Organized by skill invocation order.

---

## 1. Brand Identity prose (for `/pastiche-setup`)

When setup asks for Brand Identity, paste this:

```
Primer is GitHub's design system — functional, restrained, and engineer-facing. It clarifies rather than decorates. The UI should disappear so the user can focus on their work: code, issues, pull requests, discussions.

Density is moderate: GitHub is a productivity tool where information density matters, but readability always wins. Primer leans toward showing data efficiently without cramming.

Restraint is heavy. One primary button per page. Tooltips are a last resort. If a Primer component exists for the job, use it — no custom CSS, no bespoke solutions. The system limits itself aggressively to maintain consistency at scale.

Accessibility is not a retrofit — it's the starting posture. WCAG 2.2 AA minimum. Every interactive element must be keyboard-accessible, every color choice must meet contrast ratios, every dynamic update must be announced to screen readers.
```

---

## 2. `[GENERAL]` WISDOM (for `/pastiche-setup`)

Setup will propose its 4 canonical seeds. Accept them and adapt the wording to Primer's FACT tokens when prompted:

1. **Tokens-only** — never use raw hex, rgb, or px values; always reference Primer design tokens (`--fgColor-*`, `--bgColor-*`, `--borderColor-*`, `--shadow-*`).
2. **Spacing scale discipline** — no arbitrary gap or padding values; use Stack's gap scale (`none`, `tight`, `condensed`, `cozy`, `normal`, `spacious`) or Primer spacing tokens.
3. **Breakpoint discipline** — no arbitrary media queries; use Primer's viewport ranges (narrow <768px, regular ≥768px, wide ≥1400px) or named breakpoints (xsmall–xxlarge).
4. **Accessibility floors** — contrast ratios (4.5:1 text, 3:1 non-text), focus-visible on all interactive elements, semantic HTML by default, `aria-label` on every icon-only control.

---

## 3. KNOWLEDGE scenarios by section (for `/pastiche-write-knowledge`)

Invoke `/pastiche-write-knowledge` once per scenario below. Each block is one invocation — paste the scenario text when prompted.

### Action buttons

**Scenario 1:**
```
Primary call-to-action on a page — the single most important action the user should take.
→ `Button` variant="primary"
```

**Scenario 2:**
```
Destructive action that requires confirmation before proceeding (e.g., delete, close permanently).
→ `Button` variant="danger"
→ `ConfirmationDialog` confirmButtonType="danger"
```

### Forms & input collection

**Scenario 1:**
```
Labeled text input with validation feedback and optional helper text.
→ `FormControl`
→ `FormControl.Label`
→ `TextInput`
→ `FormControl.Caption`
→ `FormControl.Validation` variant="error"
```

**Scenario 2:**
```
Choosing a single option from a short visible list (3–6 options) where selection is required.
→ `RadioGroup`
→ `Radio`
→ `FormControl`
```

### Feedback & status

**Scenario 1:**
```
Page-level notification highlighting important information, a warning, or the result of an action.
→ `Banner` variant="info" | "warning" | "critical" | "success"
```

**Scenario 2:**
```
Localized feedback adjacent to the action that triggered it (e.g., below an input, next to a button).
→ `InlineMessage` variant="critical" | "warning" | "success" | "unavailable"
```

### Overlays

**Scenario 1:**
```
Modal dialog for transient content — editing, composing, or reviewing information that doesn't warrant a full page.
→ `Dialog`
```

**Scenario 2:**
```
Confirming a potentially destructive or irreversible user action before proceeding.
→ `ConfirmationDialog` confirmButtonType="danger"
```

### Navigation & wayfinding

**Scenario 1:**
```
Vertical sidebar navigation showing the current view and linking to sibling views within a context.
→ `NavList`
→ `NavList.Item` aria-current="page"
→ `NavList.Group`
```

**Scenario 2:**
```
Horizontal tabbed navigation switching between 2+ related views, where each tab changes the URL.
→ `UnderlineNav`
→ `UnderlineNav.Item` counter
```

### Content display

**Scenario 1:**
```
Tabular data with sorting, where each row represents an item and columns are data points about it.
→ `DataTable`
→ `Table.Container`
→ `Table.Title`
```

**Scenario 2:**
```
Displaying the status of an issue or pull request with an icon and color-coded label.
→ `StateLabel` status="open" | "closed" | "merged" | "draft"
```

### Layout & page structure

**Scenario 1:**
```
Top-level page heading with title, optional description, and action buttons — the entry point of a page.
→ `PageHeader`
→ `PageHeader.Title`
→ `PageHeader.Actions`
→ `PageHeader.Description`
```

**Scenario 2:**
```
Two-column layout with a main content area and a sidebar for navigation or metadata.
→ `SplitPageLayout`
→ `SplitPageLayout.Content`
→ `SplitPageLayout.Pane`
```

### Date & time selection

**Scenario 1:**
```
Displaying a timestamp in human-readable relative format that automatically updates (e.g., "3 hours ago", "yesterday").
→ `RelativeTime` threshold="P30D"
```

### Iconography

**Scenario 1:**
```
Icon-only button in a compact space where the icon's meaning is universally understood (e.g., close, search, settings).
→ `IconButton` aria-label="<descriptive text>" icon={OcticonName}
```

**Scenario 2:**
```
Decorative icon inside a button or list item that reinforces the adjacent text label — not the sole means of communication.
→ `Button` leadingVisual={OcticonName}
→ `ActionList.LeadingVisual`
```

### Visual hierarchy

**Scenario 1:**
```
Primary page heading that establishes the top of the content hierarchy.
→ `Heading` as="h1" | "h2"
```

**Scenario 2:**
```
De-emphasized secondary text that provides supporting context without competing with primary content.
→ `Text` size="small" weight="light"
```

### Domain-specific patterns

**Scenario 1:**
```
Chronological event history showing a sequence of comments, status changes, and activity on an issue or pull request.
→ `Timeline`
→ `Timeline.Item`
→ `Timeline.Badge`
→ `Timeline.Body`
```

**Scenario 2:**
```
Empty state placeholder when a list or page has no content yet — guiding the user toward a first action.
→ `Blankslate`
→ `Blankslate.Visual`
→ `Blankslate.Heading`
→ `Blankslate.PrimaryAction`
```

---

## 4. Atom-tagged WISDOM rules (for `/pastiche-write-wisdom`)

Invoke `/pastiche-write-wisdom` once per rule below. Paste the rule text when prompted.

**Rule 1** — tag: `Button`
```
Never render more than one variant="primary" Button in a single button group or page region. Primary is the single highest-priority action.
```

**Rule 2** — tag: `Dialog`
```
Before using size="xlarge" (640px), consider whether the content belongs on a separate page. Dialogs are for transient content, not full workflows.
```

**Rule 3** — tag: `IconButton`
```
Always provide aria-label describing the button's action. IconButton has no visible text — the label is the only accessible name.
```

**Rule 4** — tag: `NavList`
```
Never substitute TreeView for NavList when building navigation. TreeView is for hierarchical data display, not page navigation — it uses different ARIA roles and keyboard patterns.
```

**Rule 5** — tag: `FormControl`
```
Never disable or hide the submit button, even when the form is invalid. Disabled buttons break keyboard navigation and leave users without feedback on what went wrong.
```
