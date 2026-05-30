# Phase 7 — Extractor field-testing (Task 7.1)

Spec for TODO Phase 7 / task 7.1: stress-test `scripts/extract-fact-ts.ts` against varied real-world FE codebases, document gaps, and iterate the extractor until coverage is acceptable. Phase 7 contains only task 7.1, so this doubles as the per-phase kickoff spec.

## Scope

- Field-test the extractor against three new design-system codebases (Primer is excluded — already tested while building `examples/github-primer-react/`).
- Exercise the full config.yaml scenario space (not just the four illustrative examples in OSS_SPEC §9.4.1), composed from the three libraries.
- Discover gaps empirically, fix the extractor where tractable, and document residual known limitations.
- Produce a durable field-testing record and a committed, reproducible test harness.

Out of scope: cross-package duplicate-component-name collision behavior, cross-file duplicate-token dedup behavior, and any manual FACT-overrides surface.

## Locked decisions

### 1. Test codebases — the trio

Three new codebases, Primer excluded:

- `@mui/material` — `types` mode; barrel re-export chains plus deep generics.
- shadcn/ui (Radix-based) — `source_dir` mode; in-scope Tailwind CSS tokens; heavy namespacing via Radix primitives.
- `@mantine/core` — `types` mode; polymorphic `as`/`component` props and a shape structurally distinct from MUI.

### 2. Coverage is the full config.yaml scenario space

The four examples in OSS_SPEC §9.4.1 are illustrative, not the closed set. The real space is the cross-product of two axes: package composition (single `types`, single `source_dir`, multiple `types`, multiple `source_dir`, and **mixed** `types` + `source_dir` in one config) × token files (**zero**, one, multiple). The two surfaces the §9.4.1 examples miss — mixed-mode and zero-tokens — are both in scope.

### 3. The six scenarios to cover

Composed from the trio:

1. single `types`, zero tokens (MUI alone, no tokens)
2. single `types`, one token (Mantine + one CSS file)
3. single `source_dir`, one token (shadcn `ui` + one token file)
4. multiple `types` (MUI + Mantine)
5. multiple `source_dir` (shadcn `ui` + a second source dir, single token file)
6. mixed `types` + `source_dir` (MUI + shadcn `ui` in one config)

### 4. Evaluation method and tiered acceptance bar

Correctness is judged by manual spot-check against each library's public component list — no golden-file diffing. Gaps are classified into four flavors (crash, silent omission, wrong shape, noise) and graded in tiers:

- **Tier 0** — no crashes; the extractor runs to completion and writes a FACT.md on all six scenarios. Hard gate.
- **Tier 1** — no silent whole-component omissions of public components, spot-checked against each library's documented public components. Hard gate.
- **Tier 2** — prop/shape fidelity; fixed where tractable, otherwise logged as a known limitation.
- **Tier 3** — noise / over-capture; logged only.

"Acceptable coverage" means Tier 0 and Tier 1 pass on all six scenarios; Tier 2 fixed where cheap and documented otherwise; Tier 3 logged.

### 5. Systematic per-gap loop and non-regression guarantee

Each discovered gap is distilled into a minimal failing unit test in `scripts/extract-fact-ts.test.ts` (a virtual source snippet, or a tiny on-disk fixture for source-walk cases) before the extractor is fixed. The fix turns that test green while the entire existing suite stays green. The accumulating unit suite is the regression backstop: a fix made for one scenario cannot silently regress another, because the earlier scenario's distilled tests remain in the suite and must stay green.

### 6. Output document

A field-testing record at `docs/extractor-field-testing.md` (canonical `docs/`). It contains a scenario pass-matrix (the six scenarios against Tier 0/1 status) and a per-gap log. Each per-gap entry records: the scenario and library that surfaced it, the offending construct plus the distilled test name, the gap flavor, the tier, the root cause, and the resolution (fixed, with reference; or documented known limitation, with rationale). "Documented known limitation" means extractor backlog for future work — not something an adopter patches.

### 7. No manual FACT-overrides surface

There is no manual FACT-overrides surface in this phase, and 7.1 produces no go/no-go recommendation on one. Pre-release with no adopters, every extractor miss is fixed in the extractor. The TODO 7.1 line was amended to remove the prior deferral clause.

### 8. Harness location — committed scaffolding vs. ephemeral workspace

Committed: the six scenario configs, a runner, and a short README under `scripts/field-test/`, plus the distilled unit tests in `scripts/extract-fact-ts.test.ts` and the field-testing doc. Ephemeral and gitignored: the library installs and generated FACT outputs under `scripts/field-test/workspace/`.

### 9. Scenario execution order

Singles first so composite runs do not conflate per-package bugs with composition bugs: shadcn (single `source_dir`) → MUI (single `types`) → Mantine (single `types`) → multiple `types` → multiple `source_dir` → mixed. This is a guideline, not a rigid gate; a clearly foundational bug surfaced early may be fixed early.

### 10. Recovery contract for autonomous runs

When 7.1 is run autonomously (e.g. under `/goal`, which persists only the completion condition and checkpoints none of the work), durability is provided entirely by disk state. The work proceeds in committable increments: after each gap reaches a green full suite, the fix and its distilled test are committed, and the corresponding entry is appended to `docs/extractor-field-testing.md` in the same increment — not batched at the end. A run that stops partway (token exhaustion, interruption) is therefore resumable purely from git history, a green suite, and the field-testing doc, with no in-context state required to continue.

## Invariants

- Fixing the extractor for any one scenario must not regress any other scenario; the full unit suite stays green after every fix (decision 5).
- Library installs and generated FACT outputs are never committed; only configs, runner, tests, and the doc are durable (decision 8).
- Progress is checkpointed to disk continuously: commit after every green-suite checkpoint and append to the field-testing doc as each gap resolves, so an autonomous run is resumable from disk alone (decision 10).
