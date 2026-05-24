# Task 6.2.5 — Deep research session on primer.style

Spec for the primer.style research doc that serves as upstream input to KNOWLEDGE curation (6.3) and WISDOM curation (6.4). Also prototype evidence for a future "research-from-docs" `pastiche-setup` mode. Parent: Phase 6 spec §10.

## Scope

- Systematically research primer.style end-to-end and produce a single human-readable research doc at `examples/github-primer-react/docs/primer-research.md`.
- Capture decision-grade prose: enough that someone could make correct component and token choices without visiting primer.style themselves.
- The doc is a reference artifact, not a living document. It is consumed by tasks 6.3 and 6.4 and then left as-is.

## Locked decisions

### 1. Research sources

All three layers of Primer documentation:

- **primer.style design guidelines** — principles, usage guidance, do/don't rules
- **primer.style/react component API docs** — props, live examples, "when to use X vs Y" disambiguation
- **Primer Primitives** — design tokens (color, spacing, typography) with semantic intent

### 2. Depth

Decision-grade prose — captures the judgment a senior GitHub designer would have internalized. When to use one component over another, why a token exists, do/don't rules, accessibility expectations. Not a prop-by-prop API reference (FACT.md covers that mechanically).

### 3. Document structure

Follows Primer's own information architecture (Foundations → Components → Patterns → Guides), not pastiche's 12 canonical KNOWLEDGE sections. The mapping from research doc to KNOWLEDGE/WISDOM format happens downstream in tasks 6.3 and 6.4.

### 4. Execution method

Systematic WebFetch crawl of primer.style, primer.style/react, and primer.style/primitives. User reviews the output and flags gaps.

### 5. Exclusions

- Primer ViewComponents (Rails server-side components)
- Figma-specific guidance
- Contribution and governance docs (how to contribute *to* Primer)
- Deprecated components — excluded unless Primer docs provide "use X instead of Y" migration notes, which are valuable

### 6. Output format

Single file at `examples/github-primer-react/docs/primer-research.md`.

### 7. Non-affiliation banner

Included at file creation time using the locked wording from Phase 6 spec §13.
