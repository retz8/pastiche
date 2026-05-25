# Task 6.5 — Example App README Showcase

Covers the trimmed 6.5 deliverable: a compelling README at `examples/github-primer-react/README.md` that demonstrates pastiche's output quality using side-by-side visual comparisons against real GitHub UI.

## Scope

- Author `examples/github-primer-react/README.md` showcasing pastiche output.
- Run all task prompts from `docs/pastiche-task-prompts.md`, pick the three best results for the showcase.
- Capture screenshots of pastiche output and corresponding real GitHub pages.
- The README is extensible — more examples can be added later beyond the initial three.

**Killed from original 6.5:**

- Failure-mode artifacts (`artifacts/<NN>-<failure-mode>/` with round1/reviewer/round2/final intermediates).
- `docs/phase-6-findings.md` logging.

## Locked decisions

### 1. Audience

README visitors who want to see what pastiche can do, plus potential adopters who will clone and run the example app themselves.

### 2. Core content: prompt + screenshot pairs

Each showcase section pairs the exact prompt that was given to `/pastiche` with the resulting UI screenshot, shown side-by-side with real GitHub for comparison.

### 3. Side-by-side with real GitHub

Each showcase includes a pastiche output screenshot alongside a real GitHub screenshot of the equivalent page. Direct visual comparison — not implied.

### 4. Consistency claim

Stated as text (not demonstrated with multiple screenshots). Single screenshot per page. The claim is that repeated runs of the same prompt produce nearly identical UI — readers can verify by running it themselves.

### 5. Page selection: results-driven

Run all prompts, then cherry-pick the three most visually impressive results. No pages are pre-committed.

### 6. README structure

Short intro (what this example is, what pastiche does) → three side-by-side showcase sections. Extensible for additional pages later.

### 7. Prompt display: collapsible

Full prompt text in a `<details>` block within each showcase section. Reader sees the page title and screenshots immediately; expands to read the exact prompt.

### 8. Screenshot format: markdown table

Two-column markdown table per showcase: `| Pastiche Output | Real GitHub |`.

### 9. Screenshot storage

Screenshots committed at `examples/github-primer-react/assets/`.

### 10. Performance metrics

A small metrics line under each screenshot pair showing approximate token usage and run time (e.g., "~85k tokens · ~4 min"). No official benchmark exists — self-reported numbers with model/date context.

### 11. Plan requirements note

One-line prerequisite noting that pastiche requires Claude Max plan (Opus). Pro plan users can install and try it by manually switching `model: sonnet` in the agent meta.yaml, but this is unsupported and uses more tokens due to heavier reviewer corrections.

### 12. Link to pastiche documents

One sentence in the intro linking to the `pastiche/` directory so curious readers can see the FACT/KNOWLEDGE/WISDOM documents that drive the results.

### 13. Non-affiliation banner

Deferred to task 6.6 (separate task covering non-affiliation banners across the example).
