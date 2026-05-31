# KNOWLEDGE.md

The curated mapping from *UI/UX scenario* to *which components and tokens to use* — plus a prose description of your brand identity. Hand-written.

## Why it exists

A component library tells you what a `Button` *is*. It does not tell you **which** button to reach for when you need a destructive confirmation, or a quiet inline action. That judgment normally lives in a designer's head.

KNOWLEDGE.md is the **absent designer**: it writes that judgment down so the agent can make the same call your team would.

| Who/what | How it uses KNOWLEDGE.md |
|---|---|
| The **implementer** agent | Lists the section headings, then loads only the sections relevant to the task. Picks atoms from the matching scenarios. Brand Identity is always loaded. |
| **You** | Author it — interactively via `/pastiche-setup`, or one entry at a time via `/pastiche-write-knowledge`. Hand-edit freely. |

Where KNOWLEDGE has no fitting scenario, the implementer falls back to raw HTML/CSS and records the gap — which is how the document grows.

## Structure: 12 canonical sections

Every KNOWLEDGE.md declares the same 12 H2 sections (the lint enforces their presence). Sections may be empty stubs; you fill them over time. You may add further H2 sections beyond these.

| # | Section | # | Section |
|---|---|---|---|
| 1 | Action buttons | 7 | Layout & page structure |
| 2 | Forms & input collection | 8 | Date & time selection |
| 3 | Feedback & status | 9 | Iconography |
| 4 | Overlays | 10 | Visual hierarchy |
| 5 | Navigation & wayfinding | 11 | Domain-specific patterns |
| 6 | Content display | 12 | **Brand Identity** (prose) |

Sections 1–11 hold scenario→atom mappings. **Brand Identity** (12) is different: free prose, and always loaded by the implementer.

## Entry format

Within a section, each entry is a **framing line** (the scenario, in plain language) followed by one or more `→` lines mapping it to atoms:

```markdown
## Action buttons

Primary call-to-action — the single most important action on the page.
→ `Button` variant="primary"

Destructive action that needs confirmation (e.g. delete).
→ `Button` variant="danger"
→ `ConfirmationDialog` confirmButtonType="danger"
```

Rules:

| Rule | Detail |
|---|---|
| Atom names backticked | `` `Button` `` — must match a FACT.md entry **verbatim** |
| Prop expressions bare | written after the backticked atom: `variant="primary"` |
| Multiple `→` per scenario | a scenario can map to several atoms used together |
| No invented atoms | derived utility forms / untracked Tailwind don't belong here — those are WISDOM `[GENERAL]` rules |

## Brand Identity

Prose, not mappings — the aesthetic spirit that can't be reduced to a lookup table. A few short paragraphs on density, restraint, tone, and accessibility posture. Example (Primer):

> Primer is GitHub's design system — functional, restrained, and engineer-facing. It clarifies rather than decorates… Restraint is heavy. One primary button per page. If a Primer component exists for the job, use it — no custom CSS.

If you opt in to a `DESIGN.md` during setup, its content can seed this section.

## Related

- Atoms referenced here must exist in [`fact.md`](./fact.md).
- Cross-cutting rules (one primary button per page, spacing scales) live in [`wisdom.md`](./wisdom.md), not here.
