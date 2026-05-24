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

_(empty — run /pastiche-setup --section forms-input-collection)_

## Feedback & status

_(empty — run /pastiche-setup --section feedback-status)_

## Overlays

_(empty — run /pastiche-setup --section overlays)_

## Navigation & wayfinding

_(empty — run /pastiche-setup --section navigation-wayfinding)_

## Content display

_(empty — run /pastiche-setup --section content-display)_

## Layout & page structure

_(empty — run /pastiche-setup --section layout-page-structure)_

## Date & time selection

_(empty — run /pastiche-setup --section date-time-selection)_

## Iconography

_(empty — run /pastiche-setup --section iconography)_

## Visual hierarchy

_(empty — run /pastiche-setup --section visual-hierarchy)_

## Domain-specific patterns

_(empty — run /pastiche-setup --section domain-specific-patterns)_

## Brand Identity

Primer is GitHub's design system — functional, restrained, and engineer-facing. It clarifies rather than decorates. The UI should disappear so the user can focus on their work: code, issues, pull requests, discussions.

Density is moderate: GitHub is a productivity tool where information density matters, but readability always wins. Primer leans toward showing data efficiently without cramming.

Restraint is heavy. One primary button per page. Tooltips are a last resort. If a Primer component exists for the job, use it — no custom CSS, no bespoke solutions. The system limits itself aggressively to maintain consistency at scale.

Accessibility is not a retrofit — it's the starting posture. WCAG 2.2 AA minimum. Every interactive element must be keyboard-accessible, every color choice must meet contrast ratios, every dynamic update must be announced to screen readers.
