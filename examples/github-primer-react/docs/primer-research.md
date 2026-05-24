> *This example uses GitHub Primer (`@primer/react`) as a reference design system to demonstrate pastiche. It is not affiliated with, endorsed by, or sponsored by GitHub. Primer is a trademark of GitHub, Inc. All Primer atom names, tokens, and component shapes appearing in this example or in `KNOWLEDGE.md` / `WISDOM.md` are property of GitHub, Inc.*

# Primer Design System — Research Document

Deep research on GitHub's Primer design system, synthesized from primer.style (design guidelines), primer.style/react (component API), and Primer Primitives (design tokens). This document captures decision-grade knowledge — enough to make correct component and token choices without visiting the source docs.

---

## 1. Philosophy and Principles

Primer is GitHub's design system, maintained by the Design Infrastructure and Design Engineering teams since early 2016. Its core values:

**Consistency at scale.** Primer exists so that teams across GitHub build with unified patterns rather than inventing bespoke solutions. Every component, token, and pattern is designed to be reusable across the product.

**Accessibility first.** GitHub targets WCAG 2.2 AA conformance. Accessibility is not a retrofit — it's embedded into every component's API (ARIA attributes, keyboard navigation, focus management). The system recognizes disability across permanent, temporary, and situational categories.

**Minimal custom CSS.** Primer pushes developers toward using components and design tokens rather than writing custom styles. The `sx` prop and raw CSS should be last resorts; if you're reaching for them frequently, the design likely needs to be reconsidered against existing Primer patterns.

**Content-first pages.** A page should enable the person to focus on the content. Layouts must remain fully functional across screen sizes and leverage existing mental models from GitHub and web conventions.

---

## 2. Foundations

### 2.1 Color

Primer's color system operates through design tokens (CSS variables) that automatically adjust across light and dark modes. Nine themes are supported, including high-contrast and colorblind-friendly variants.

#### Token hierarchy

- **Base tokens** (e.g., `color-scale-pink-5`): raw values mapping to the color scale. **Never use directly in code.** They exist only as references for the functional layer.
- **Functional tokens** (e.g., `bgColor-inset`, `borderColor-default`): global UI patterns. These are the primary tokens to use. They respect color modes automatically.
- **Component/pattern tokens** (e.g., `focus-outlineColor`, `button-primary-bgColor-hover`): scoped to specific components. Use only when functional tokens don't cover the case.

#### Functional color categories

Tokens are prefixed by their role:

- `--fgColor-*` — foreground: text and icon colors
- `--bgColor-*` — background: surface fills
- `--borderColor-*` — borders and dividers
- `--shadow-*` — elevation and depth

#### Neutral scale

The neutral scale runs 0–13, inverted between light and dark themes so they can share many functional tokens:

- Steps 0–5: backgrounds (`bgColor-default` at 0, `bgColor-muted` at 1–2, inset surfaces at 3–5)
- Steps 7–8: borders and dividers
- Steps 9–10: text and icons (step 9 meets minimum contrast against steps 0–4; step 10 works against 5–6)

For high-contrast themes, shift up the scale to achieve 7:1 minimum ratios.

#### Semantic colors

Each role has foreground, background (muted + emphasis), and border variants:

| Role | Purpose |
|------|---------|
| `accent` | Links, selected/active states, focus indicators, neutral information |
| `success` | Primary buttons, positive messaging, open states |
| `attention` | Warnings, queued items, in-progress states |
| `danger` | Destructive actions, errors, closed states |
| `severe` | High-severity warnings |
| `open` / `closed` / `done` | Workflow and issue/PR status |
| `sponsors` | GitHub Sponsors branding |

**Muted** backgrounds are subtle — pair with borders to increase contrast. **Emphasis** backgrounds are bold — must pair with `fgColor-onEmphasis` for text on them.

#### Practical rules

- Always use tokens, never hardcode hex values — themes break otherwise.
- Test contrast against the intended background token, not arbitrary colors.
- Use borders around elements when a softer background must be used, to increase perceived contrast.
- For interactive controls, use scale steps to differentiate rest, hover, and active states.

### 2.2 Typography

Primer's type system uses `rem` units for accessible browser zoom and unitless line heights aligned to a 4px grid.

#### Core principles

- **Shorthand tokens** bundle size, family, weight, and line-height into a single `font` CSS declaration. Use these rather than setting individual properties.
- **Font weight**: always use CSS variables (e.g., `--text-subtitle-weight`), never arbitrary numeric values like `700`.
- **Heading hierarchy**: use semantic heading tags (`h1`–`h6`) combined with visual styles. Never reorder heading tags to achieve a visual design — an `h2` must not precede an `h1` in markup.

#### Best practices

- Emphasize hierarchy through the type scale, not through color.
- Line length: ~80 characters or fewer per line (W3C guidance).
- Alignment: default to left-aligned, ragged-right. Avoid centering or right-aligning unless there's a strong reason.
- Use the `Heading` component for structural hierarchy and the `Text` component for body/inline typography.

### 2.3 Spacing and Layout

#### Spacing

Spacing tokens follow a base-4/base-8 scale. Use the `Stack` component's gap scale (`none`, `tight`, `condensed`, `cozy`, `normal`, `spacious`) rather than raw pixel values when possible.

#### Viewport ranges

Primer uses three opinionated viewport ranges for layout decisions:

| Range | Width | Columns | Purpose |
|-------|-------|---------|---------|
| Narrow | <768px | 1 | Mobile — single column |
| Regular | ≥768px | Up to 2 | Desktop patterns begin |
| Wide | ≥1400px | Up to 3 | Optional third column |

#### Breakpoints (for fine-tuning)

- xsmall: 320px
- small: 544px
- medium: 768px
- large: 1012px
- xlarge: 1280px
- xxlarge: 1400px

Use viewport ranges for high-level layout decisions; use breakpoints for fine-tuning within those ranges.

#### Content padding

| Breakpoint | Content region | Pane region |
|-----------|---------------|-------------|
| xsmall–large | 16px | 16px |
| xlarge–xxlarge | 24px | 16px |

Padding is included within max-width calculations.

#### Page types

- **Full pages**: centered content, max-width xlarge (1280px)
- **Split pages**: side pane with independent scrolling; content may remain centered
- **Interstitial pages**: narrow flows (xsmall max-width) for auth or focused operations

#### Page anatomy

- App header (non-fixed, global nav)
- Context region (breadcrumb-like: `:owner / :repository`)
- Content region (primary subject)
- Left/right pane regions (navigation, filtering, metadata)
- App footer

### 2.4 Responsive Design

#### Core requirements

- Minimum supported: 320px wide, 256px tall
- All content must remain accessible at 400% zoom on a 1280px screen
- Touch targets: minimum 24px (AA), recommended 44px for mobile (AAA)
- Never rely solely on hover — provide alternative interactions for touch devices

#### User preference media features to respect

- `prefers-color-scheme`
- `prefers-contrast`
- `prefers-reduced-motion`
- `forced-colors`
- `inverted-colors`

#### Narrow viewport strategies for panes

- **Split into pages**: show pane OR content, drill-down navigation
- **Bottom sheet**: display pane as overlay triggered by narrow-specific buttons
- **Stack vertically**: pane above or below content (avoid if pane has many links)

### 2.5 Icons (Octicons)

Octicons are GitHub's SVG icon set. Primary sizes:

- **16px**: comprehensive library (600+ icons) — default for most UI
- **24px**: extended set (600+ icons) — for larger touch targets or emphasis
- **12px**: minimal set (9 icons) — tight spaces only

Use octicon names from `@primer/octicons-react`. Icons in Primer components go into `leadingVisual` or `trailingVisual` slots.

---

## 3. Components

### 3.1 Actions and Buttons

#### Button

The primary interactive element. Variants:

- **Primary**: highest-priority action. Use sparingly — never more than one per button group, rarely more than one per page.
- **Default**: general actions; pairs well with primary for secondary actions.
- **Invisible**: transparent background for minimal UI or compound components.
- **Danger**: destructive actions only; typically prompts a confirmation dialog.
- **Link**: renders as a link visually but with button semantics.

Sizes: `small`, `medium` (default), `large`. Use `large` sparingly for emphasis.

Key props: `leadingVisual`, `trailingVisual`, `trailingAction` (e.g., dropdown indicator), `loading` (shows spinner replacing the visual slot while label stays visible), `count` (counter badge), `inactive` (visually disabled but still accessible — for system outages), `block` (full-width).

**Critical guidance**: avoid `disabled` — it breaks keyboard navigation. Use `inactive` instead for system-level unavailability.

#### IconButton

Icon-only button. Same variants and sizes as Button. **`aria-label` is mandatory** — there's no visible text. Supports `description` prop for tooltip and `keybindingHint` for keyboard shortcut display.

#### ButtonGroup

Renders a series of buttons in a horizontal row. Use for related actions.

#### LinkButton

Not a separate component — use `Button` with `as="a"` and provide `href`.

### 3.2 Action Lists and Menus

#### ActionList

Vertical list of interactive actions. The base building block for menu-type components.

Structure: `ActionList` > `ActionList.Item` (with optional `ActionList.LeadingVisual`, `ActionList.TrailingVisual`, `ActionList.TrailingAction`, `ActionList.Description`).

Grouping: `ActionList.Group` with headings (filled or subtle variants), `ActionList.Divider` for visual separation.

Selection: `selectionVariant="single"` (radio) or `"multiple"` (checkbox). Selections shown with check icons at item start.

Item variants: default, `danger` (destructive actions), `disabled`, `inactive` (with explanatory text for system issues), `loading`.

Descriptions can be `inline` (beside text) or `block` (below text).

#### ActionMenu

Combines ActionList with Overlay. Triggered by Button, IconButton, or right-click (context menu).

Item types: actions (`onSelect`), single/multi select, submenus (nested `ActionMenu`), loading items, inactive items.

When all items are inactive, mark the trigger button itself as inactive.

**Accessibility**: items get roles `menuitemradio` or `menuitemcheckbox` depending on selection mode. Requires `aria-label` on the ActionList.

#### SelectPanel

Dialog for navigating and selecting from lists. More powerful than ActionMenu — adds search/filter, loading states, empty states, and footer actions.

Three display variants: anchored (default, opens near trigger), modal (center screen), full-screen (on narrow viewports).

Selection: single (returns one item) or multi (returns array). Optional "Select all" checkbox. Can show selected items at top.

**When to choose**: SelectPanel for multi-select with search or grouped items; ActionMenu for quick single actions or commands; Select for simple single-option dropdowns.

### 3.3 Forms and Input

#### FormControl

The wrapper for all form inputs. Provides label, caption, validation, and ARIA attribute management.

Structure: `FormControl` > `FormControl.Label` + input component + optional `FormControl.Caption` + optional `FormControl.Validation`.

Key props: `required`, `disabled`, `layout` ("vertical" default or "horizontal" for checkboxes/radios).

Labels can be visually hidden (`visuallyHidden={true}`) while maintaining semantic HTML. Never use placeholder text as a substitute for labels.

**Validation**: `error` or `success` variants. For 3+ errors, use an interactive summary in a Banner with anchor links to invalid fields.

#### TextInput

Single-line text input. Sizes: `small`, `medium`, `large`.

Visual slots: `leadingVisual` (icon left), `trailingVisual` (icon right), `trailingAction` (button inside). **Don't use both leading and trailing visuals simultaneously.**

Loading state replaces the visual slot with a spinner (no layout shift). Supports `monospace` for code inputs and `characterLimit`.

#### Textarea

Multi-line text input. Default: 30 chars wide, 7 lines tall. Resize behavior: `both` (default), `horizontal`, `vertical`, `none`. Use `block` for full-width. Supports `characterLimit` and `contrast` (higher background contrast).

#### Select

Simple dropdown for single predefined choices. Sizes: `small`, `medium`, `large`. Supports option groups (`Select.OptGroup`), placeholder text, and validation states.

**When to use**: Select for simple finite lists; RadioGroup for short visible lists; SelectPanel for filtered/searchable lists; ActionMenu for command-style menus.

#### Autocomplete

Text input with filtered suggestions. Supports single and multi-select (with `TextInputWithTokens` for displaying selections). Custom filter functions, add-new-item capability, loading state.

#### Checkbox / CheckboxGroup

Checkbox for single or multiple selections. Supports `indeterminate` state. Always use within a `CheckboxGroup` — validation and required indicators go on the group, not individual checkboxes.

#### Radio / RadioGroup

Single selection from a short list. Must always be in a `RadioGroup`. Radio buttons cannot be unchecked — use for required selections. Validation goes on the group level.

#### ToggleSwitch

Immediate on/off toggle. Does not require form submission — changes apply instantly. Displays "On"/"Off" status label. Sizes: default and small. Requires `aria-labelledby`.

**When to choose**: ToggleSwitch for immediate binary settings; Checkbox for selections that require form submission.

#### SegmentedControl

Pick one choice from a linear set of related options with immediate application. Items can be text (`SegmentedControl.Button`) or icon-only (`SegmentedControl.IconButton` with mandatory `aria-label`).

Sizes: `small`, `medium`. Supports `fullWidth`, `count` on items, and responsive `variant` (`hideLabels`, `dropdown`, or `default`).

**When to choose**: SegmentedControl for switching between related views or formats; UnderlineNav for URL-based navigation; RadioGroup for form selections.

### 3.4 Overlays and Dialogs

#### Dialog

Floating surface for transient content. Sizes: small (296px), medium (320px), large (480px), xlarge (640px) width; small, large, or auto height.

Structure: header (title + optional subtitle + close button), body (scrollable when overflow), footer (action buttons via `footerButtons` array).

Positioning: center (default), left, right, bottom. Supports responsive positioning — e.g., bottom on narrow viewports for mobile bottom-sheet behavior.

Focus management: `initialFocusRef` (what to focus on open), `returnFocusRef` (what to refocus on close).

ARIA roles: `dialog` (standard) or `alertdialog` (urgent). Title becomes `aria-label`, subtitle becomes `aria-describedby`.

**Before using xlarge**: consider whether the content belongs on a separate page instead.

#### ConfirmationDialog

Specialized Dialog for confirming actions. Title is typically a brief question. Two buttons: confirm and cancel.

`confirmButtonType`: `normal`, `primary`, or `danger`. When `danger`, the cancel button receives initial focus (safety measure against accidental confirmation).

`useConfirm` hook provides an imperative API for triggering confirmations without managing dialog state.

#### AnchoredOverlay

Opens an Overlay relative to an anchor element. Provides positioning control (`side`, `align`, `anchorOffset`), focus trapping, and responsive behavior (`preventOverflow`, fullscreen on narrow viewports).

Use AnchoredOverlay when building custom overlay patterns. For standard use cases, prefer ActionMenu, SelectPanel, or Dialog.

#### Overlay

**Internal/private API** — not for direct use. The foundation layer that Dialog, AnchoredOverlay, and other overlay components build on. Handles shadows, focus trapping, escape/click-outside dismissal.

### 3.5 Navigation

#### NavList

Vertical navigation sidebar. Shows which view the user is currently on. Typically changes what's rendered in the main content area.

Structure: `NavList` > `NavList.Item` (with `href`), `NavList.Group` (with titles), `NavList.SubNav` (nested, up to 4 levels — deeper suggests redesign), `NavList.Divider`.

Current state: `aria-current="page"` on the active item.

Visual slots: `NavList.LeadingVisual`, `NavList.TrailingVisual`, `NavList.TrailingAction` (interactive, e.g., pin button).

**Do not replace NavList with TreeView** for navigation. TreeView serves a different purpose (hierarchical data display, not navigation).

#### UnderlineNav

Horizontal tabbed navigation between 2+ related views. Each tab changes the URL.

Supports counter badges (`counter` prop), leading icons (all items should have icons or none), and loading states (`loadingCounters`).

Variants: `inset` (default, children offset from edges) or `flush` (children flush with edges).

**When to choose**: UnderlineNav for URL-changing tabs; UnderlinePanels for content-toggling tabs without URL change.

#### Breadcrumbs

Hierarchical position display. Items accept `href` and `selected` (for current page, sets `aria-current="page"`). Overflow handling: wrap, collapse into menu, or collapse with root visible.

Use for pages deep within a site hierarchy.

#### Pagination

Horizontal page links. Required props: `currentPage`, `pageCount`. Supports truncation with ellipses, configurable surrounding/margin page counts, and custom `hrefBuilder`.

### 3.6 Content Display

#### Heading

Defines content hierarchy. Renders an `h2` by default (customizable via `as`). No default styling — visual appearance is separate from semantic level. Use `Heading` for structure, `Text` for styling without hierarchy.

#### Text

Typographic styling abstraction. Props: `size` (large/medium/small), `weight` (light/normal/medium/semibold), `as` (default `span`). Use for body content and inline typography.

#### Label

Contextual metadata tag. 10 variants: default, primary, secondary, accent, success, attention, severe, danger, done, sponsors. Sizes: small (default), large.

#### StateLabel

Issue/PR status indicator with contextual icons and colors. Statuses: draft, open, merged, closed, closed-not-planned, unavailable, queued. Sizes: normal, small.

#### CounterLabel

Numeric count badge for navigation elements and buttons. Schemes: secondary (default, lighter) or primary (darker, visually heavier).

#### Token

Compact metadata representation, typically used in collections. Variants: default and `IssueLabelToken` (with `fillColor`). Sizes: small, medium, large, xlarge. Supports `leadingVisual`, `onRemove` (with remove button), and interactive rendering (`as="button"` or `as="a"`).

#### Avatar / AvatarStack

Avatar displays user/org images. Shape matters: **circles for people**, **squares for non-human entities** (bots, teams, orgs). Sizes from 16px to 64px. Requires `alt` text when displayed without a name beside it. Responsive sizes via `{narrow, regular, wide}`.

AvatarStack groups multiple avatars inline.

#### RelativeTime

Displays time in human-readable relative format. Formats: `auto` (default), `micro` (compact), `elapsed`. Switches from relative to absolute display after threshold (default 30 days). Configurable precision from year to second.

#### Timeline

Vertical sequence of events with connecting visual elements. Structure: `Timeline` > `Timeline.Item` > `Timeline.Badge` (icon, colored) + `Timeline.Body` (content). Supports `condensed` mode (reduced padding, no badge background), `Timeline.Break` (visual separator, not conveyed to assistive tech).

Badge color variants: accent, success, attention, severe, danger, done, open, closed, sponsors.

#### DataTable

2D data display. Column config: `header`, `field`, `rowHeader` (primary identifier), `renderCell` (custom rendering), `sortBy` (alphanumeric/datetime), `align`, `width` (grow/growCollapse/auto/fixed).

Sorting: one column must have a default sort. Cell density: condensed, normal (default), spacious.

Row actions: single action as IconButton, multiple actions in dropdown (kebab), or mixed. Action column headers should be visually hidden but screen-reader accessible.

### 3.7 Feedback and Status

#### Banner

Page/section-level notifications. Variants: info (default), warning, critical, success, upsell.

Features: dismissible (`onDismiss`), primary/secondary actions, custom leading visuals (info and upsell only), compact layout, flush layout (for dialogs, tables, cards).

#### InlineMessage

Localized feedback near where an action occurred. Variants: critical, warning, success, unavailable. Sizes: default (medium), small.

**Key distinction**: InlineMessage for field-level/localized feedback; Banner for page/section-level notifications.

#### Spinner

Indeterminate loading indicator. Sizes: small, medium, large. `srText` for screen readers (defaults to "Loading"). Use `delay` to avoid flashing for fast operations.

#### SkeletonAvatar / SkeletonBox / SkeletonText

Content-shaped loading placeholders. SkeletonText supports typography sizes (titleLarge through bodySmall) and multi-line (`lines` prop). SkeletonAvatar mirrors Avatar's size and shape options.

**When to choose**: Skeleton loaders for predictable content shapes (lists, cards); Spinner for unknown/variable content.

#### ProgressBar

Shows completion or parts of a whole. Single or multi-segment. Sizes: small, medium (default), large. Always pair with visible text showing the value (e.g., "4 of 12"). Multi-segment: use distinguishable colors with a legend; avoid too many segments.

#### Blankslate

Empty state placeholder. Structure: visual (icon), heading, description, primary action (button/link), secondary action (text link). Variants: narrow, spacious, bordered.

Use welcoming language for first-time states, alert icons for error states. Always push users toward a next step.

### 3.8 Layout Components

#### PageLayout

Multi-region page structure: header, content, pane, sidebar, footer. Pane can be positioned start/end, sized (small/medium/large or custom min/max/default), made sticky, and made resizable (width persists to localStorage).

Responsive: regions can be hidden/shown per viewport (`narrow`, `regular`, `wide`). Use responsive dividers for narrow screens.

#### SplitPageLayout

Two-column layout with main content and sidebar/pane. Content max-width options: full, medium, large, xlarge. Pane positioning: start/end, responsive. Sidebar supports sticky and fullscreen-on-narrow variants.

#### Stack

Flexible layout primitive. Direction: vertical (default) or horizontal. Gap scale: none, tight, condensed, cozy, normal, spacious. Alignment: stretch, start, center, end, baseline. Justify: start, center, end, space-between, space-evenly. Wrapping: nowrap (default) or wrap. All props accept responsive values.

`Stack.Item` provides `grow` and `shrink` for individual item control.

#### PageHeader

Top-level page heading with context and navigation. Sub-components: TitleArea, Title (renders h2 by default), Description, Actions, Navigation (e.g., UnderlineNav), LeadingAction/TrailingAction, LeadingVisual/TrailingVisual, Breadcrumbs, ContextArea/ContextBar (mobile-specific).

Responsive behavior: ContextArea/ContextBar hidden on regular/wide; LeadingAction/TrailingAction hidden on narrow.

TitleArea variant: `"large"` for user-generated content (issues, PRs, discussions).

### 3.9 Progressive Disclosure

#### Details

Enhanced `<details>` HTML element. Toggles content visibility with a summary button. Supports `defaultOpen`, `closeOnOutsideClick`. Use for simple show/hide; Dialog for modal behavior.

#### TreeView

Hierarchical list with expand/collapse. Structure: `TreeView` > `TreeView.Item` (with `id`) > `TreeView.SubTree`. Supports controlled/uncontrolled expanded state, async loading (with skeleton placeholders), leading/trailing visuals, and error dialogs with retry.

`current` prop marks the active item; path to current item auto-expands.

**Never use TreeView as navigation** — use NavList for that purpose.

---

## 4. UI Patterns

### 4.1 Forms

**Layout**: vertical is the default and preferred layout. Horizontal layout only for checkboxes/radios.

**Labels**: descriptive, concise (≤3 words), sentence case. Never use placeholder text as a label substitute — it disappears and fails contrast requirements.

**Required fields**: visually mark them to match code-level requirements. Don't mark individual checkboxes/radios as required — mark the group.

**Validation timing**: default to submit-time validation. After initial failure, switch to inline validation on blur. Never validate while the user is still typing.

**Error display**: for 3+ errors, use a Banner with interactive summary (anchor links to invalid fields). Focus the first invalid input or the error summary. Mark invalid inputs with `aria-invalid="true"` and connect error messages via `aria-describedby`.

**Progressive disclosure in forms**: parent selections (checkboxes/radios) can reveal nested child fields. Use visually hidden labels when parent context is sufficient; visible labels when it's not.

**Failed submission**: keep all fields and the submit button visible. Never disable the submit button, even when the form is invalid — maintain keyboard accessibility.

**Input method selection**:
- Open-ended text → TextInput or Textarea; Autocomplete if suggestions apply
- Finite options → RadioGroup (single, short list), CheckboxGroup (multi), Select (single dropdown), ActionMenu (command-style)

### 4.2 Loading

**Wait time rules**:

| Duration | Approach |
|----------|----------|
| <1 second | No loading indicator — flashing one feels slower |
| 1–3 seconds | Indeterminate (Spinner or skeleton) |
| 3–10 seconds | Determinate (ProgressBar) to explain the wait |
| >10 seconds | Determinate + background task treatment |

**Indicator types**:
- Spinner: most versatile, for unknown duration
- Content skeletons: show page shape for large areas, can feel faster
- Animated icons: reserve for branding moments, use sparingly
- ProgressBar: for known/estimable duration

**Content loading strategy**: show each item as soon as it loads — don't wait for the entire collection. Prioritize important data first.

**Placement**: position indicators nearest to relevant content. For large areas, center within viewport. Consolidate multiple small indicators into one.

**Accessibility**: use `role="status"` or `aria-live` for completion/failure announcements. Apply `aria-busy="true"` during updates. Move focus to first focusable element in newly loaded content.

### 4.3 Navigation

**Four navigation types**:
1. New page (URL changes, full load or SPA transition) — include breadcrumbs/back buttons
2. Same page, different state (filter change, sort) — avoid full reload
3. Same page, different scroll position (anchor links)
4. Dialog (focus trapped, page interaction blocked)

**Sidebar patterns**:
- Index-to-detail: on narrow, hide sidebar when viewing detail page; show back arrow
- Filter sidebar: on narrow, move filters into ActionMenu or bottom-sheet Dialog (max ~15 items per ActionMenu)
- Hybrid: combine both, consolidate into menus on narrow

**Tab navigation decision tree**:
- Format change (list/grid)? → SegmentedControl as tablist
- Mutually exclusive filters with "All"? → UnderlinePanels
- URL changes on tab activation? → UnderlineNav
- Default? → UnderlinePanels

**Accessibility**: skip links for bypassing dense nav, tab order matching visual order, heading structure as the primary screen-reader navigation technique.

### 4.4 Notification Messaging

**Components by prominence**:
- Banner: high prominence, page/section level
- InlineMessage: lower prominence, field/action level

**Message categories**:
- System updates: GitHub-originated, Banner
- Feedback: results of user actions, Banner or InlineMessage
- Awareness: contextual info, either component

**Six message states**: info, warning, critical, success, unavailable, upsell.

**Placement**: near the related action. Top of body for page-wide. Inside dialogs: below header, full-width. Inline: directly near the input/action.

### 4.5 Saving

**Two patterns**:
- **Explicit saving** (default): user clicks submit. Best for text inputs, checkboxes, radios, native selects, multi-selects.
- **Automatic saving**: changes apply immediately. Best for ToggleSwitch, SegmentedControl, single-select dropdowns.

**Never mix** auto-save and explicit-save controls in the same form.

**Save button rules**:
- Never disable or hide the save button, even when the form is invalid
- Primary button for page-wide saves, secondary for section-specific
- Bottom-left for standard forms, bottom-right for dialogs/comments
- Active verbs: "Save," "Create," "Update," "Delete"

**Error handling**: preserve user data on failure. Use InlineMessage for changes without redirect, Banner for changes with page refresh. Offer undo for destructive actions; ask confirmation before risky operations.

### 4.6 Empty States

Use the Blankslate component. Elements: graphic (icon or illustration), primary text (feature purpose or error summary), secondary text (brief, non-redundant), primary action (brief verb), secondary action (docs/guides link).

- Feature not yet used: welcoming language, illustration, action to get started
- Temporarily empty: acknowledge the feature's nature
- Error state: concise problem summary, alert icon (not playful imagery), recovery path
- Push users forward via alternative paths rather than dead ends

### 4.7 Degraded Experiences

When optional services fail, show the page without the failed component rather than blocking entirely.

- **Primary experiences** (essential): show error page when unavailable
- **Secondary experiences** (enriching): hide or replace with error messaging

**Strategies**: global Banner (warning variant) at page top, inline error messages with warning icons, Blankslate for large failed sections, hide non-critical elements silently only when it won't confuse users.

**Never disable interactive controls** due to availability issues. Use the `inactive` state instead — it remains keyboard-accessible and can show explanatory text.

### 4.8 Progressive Disclosure

Hide and reveal information based on user interaction. Use sparingly.

- **Chevron icon**: collapsible content, toggles open/closed (not for dropdowns or pagination)
- **Fold/unfold icon**: expandable text content, stands alone
- **Ellipsis icon**: truncated inline text (not a kebab menu)
- **Kebab icon**: dropdown menus only, not progressive disclosure

Always pair disclosure icons with descriptive text.

### 4.9 Feature Onboarding

- **Teaching bubbles**: popovers highlighting features, ~160 chars, one at a time, clear dismissal
- **Page banners**: announcements relevant to current page, clear dismissal, defined campaign duration
- **Empty states**: guide users during first use
- Maximum 2 alerts visible at once

### 4.10 Data Visualization

Supported charts: bar, line, area, progress bar. Not supported: donut, sparkline.

Color rules: marks must achieve 3:1 contrast against background. Differentiate items using more than color alone. Muted colors require outlines.

Recommended limits: max 5 lines in line charts, max 10 bars, max 5 pie slices.

---

## 5. React Integration

### 5.1 Setup

```
npm install @primer/react @primer/primitives react react-dom
```

Wrap root with `ThemeProvider` and `BaseStyles`:

```jsx
import '@primer/primitives/dist/css/functional/themes/light.css'
import {BaseStyles, ThemeProvider} from '@primer/react'

function RootLayout() {
  return (
    <ThemeProvider>
      <BaseStyles>
        <App />
      </BaseStyles>
    </ThemeProvider>
  )
}
```

`BaseStyles` applies baseline `color`, `font-family`, and `line-height` to the body. TypeScript types are included.

Peer dependencies: `@primer/primitives` (9.0.0+), `react` (17.x+), `react-dom` (17.x+).

### 5.2 Component Import Pattern

```jsx
import {Button, TextInput, FormControl} from '@primer/react'
```

All components are named exports from `@primer/react`. Some experimental components may require importing from `@primer/react/experimental` or `@primer/react/drafts`.

### 5.3 Theming

Nine themes available: light, dark, light_high_contrast, dark_high_contrast, light_colorblind, dark_colorblind, light_tritanopia, dark_tritanopia, and auto (follows system preference).

Theme attributes on `<body>`:
- `data-color-mode`: `auto`, `light`, or `dark`
- `data-light-theme`: specific light variant
- `data-dark-theme`: specific dark variant

---

## 6. Accessibility Deep Dive

### 6.1 Principles

- WCAG 2.2 AA conformance target
- Accessibility integrated from design start, not retrofitted
- 16% of global population experiences disability — permanent, temporary, or situational
- Thoughtfully designed features often benefit everyone

### 6.2 Color Contrast

- Text to background: 4.5:1 minimum
- Non-text elements (icons, borders, chart marks) to background: 3:1 minimum
- High-contrast themes shift neutral scale for 7:1 ratios
- Never rely on color alone to convey information

### 6.3 Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must match visual order
- Skip links to bypass dense navigation
- Focus must be visible and managed (especially in overlays and dialogs)

### 6.4 Screen Readers

- Headings are the primary navigation technique for screen reader users — maintain proper hierarchy
- Use `aria-label`, `aria-labelledby`, `aria-describedby` appropriately
- `aria-live` regions for dynamic content updates
- `role="status"` for loading completion/failure
- `aria-busy="true/false"` during content updates
- `aria-current="page"` for active navigation items
- `aria-invalid="true"` for form validation errors

### 6.5 Focus Management

- Dialogs: `initialFocusRef` on open, `returnFocusRef` on close
- Danger confirmations: focus cancel button, not confirm
- Loading completion: move focus to first focusable element in new content
- Overlays: trap focus within; restore on close

### 6.6 Component-Specific Requirements

- **IconButton**: mandatory `aria-label`
- **Avatar**: `alt` text when displayed without adjacent name
- **Tooltip**: last resort for information delivery; never put critical info in tooltips
- **FormControl**: automatically manages ARIA relationships between label, input, caption, and validation
- **ToggleSwitch**: mandatory `aria-labelledby`
- **SegmentedControl.IconButton**: mandatory `aria-label`
- **Timeline.Break**: decorative only, not conveyed to assistive tech
- **DataTable action columns**: headers visually hidden but screen-reader accessible
