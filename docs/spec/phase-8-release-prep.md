# Phase 8 — Release prep: restructure, packaging & docs

Phase-level spec for Phase 8 of the pastiche OSS v1 delivery plan (`_dev/docs/TODO.md`), retitled from "Packaging & docs". Captures the decisions shared across tasks 8.1–8.8; per-task grills inherit from here. Detailed scope for 8.3–8.8 is deferred to each task's own spec.

## Scope

Phase 8 is a **pre-release cleanup / refactor** phase, not only packaging and docs. It carries license to change the **form** of work delivered in earlier phases (e.g. moving or re-enveloping files) but **not** to rewrite its **content** — a body authored in a prior phase keeps its content; only its shape/location may change. Concretely, the phase covers: a repo restructure into a `[core] + [adapters]` layout, a build + distribution refit for Claude Code plugin publishing, and the release docs (LICENSE, README, per-document format docs, adapter docs, contributing guide, example showcase README).

## Locked decisions

### 1. Agents stay first-class (canonical body + per-platform adapter)

Pastiche's three agents remain first-class: canonical agent bodies plus per-platform adapter envelopes are kept. The alternative pattern (dissolving agents into inline-dispatched generic prompts, as in superpowers) was rejected — it violates pastiche's invariant of canonical bodies + per-platform adapters and over-abstracts. The abstraction level is decided per concept: skills genuinely converge across platforms (shared `SKILL.md`, no adapter, per task 3.2), while agents genuinely diverge (Claude YAML frontmatter vs Codex TOML `developer_instructions`), so agents get a canonical body + per-platform adapter. The build/render step is the deliberate adaptation seam. Per-role model pinning (Opus for round 1, Sonnet for round 2 and the reviewer) stays declarative in the per-platform agent meta sidecars — it is a feature of the seam.

### 2. Repo structure = `[core] + [adapters]`

The repo is regrouped into a core/adapters layout:

```
core/
  agents/      canonical bodies + per-platform sidecars (adapted content)
  skills/      canonical SKILL bodies (content, not adapted)
  templates/   the three docs — pastiche-specific (not adapted)
  tools/
    extract-fact/   TS source + test + __fixtures__ (bundled to bin/extract-fact)
    pastiche-lint/  Rust cargo project, Cargo.toml here (compiled to bin/pastiche-lint)
adapters/
  claude-code/  the seam: manifest render rules + agents.template
scripts/        dev tooling only, ships nothing: build orchestrator + adapter registry, field-test harness
docs/  examples/
```

Rationale: `extract-fact` and `pastiche-lint` are shipped runtime executables — invoked by skills off the plugin's `bin/` PATH on the adopter's machine — so they belong to `core`. `build.ts` runs only on the maintainer's machine and ships nothing, so it stays under `scripts/` as dev tooling. The two are on opposite sides of the ships-to-adopter line and cannot be grouped. Within `core`, `tools/` groups shipped executables (the same binary across all platforms, not adapted) separately from `agents/` (adapted content); each tool gets its own subdir so the Rust and TS toolchains stay isolated.

### 3. Versioning: lockstep single version

A single version fans out to every per-platform build artifact; pastiche does not use per-platform/independent versioning. Basis: independent versioning fits only genuinely independent products, whereas pastiche's platform artifacts all wrap the same canonical core (one source of truth, one cadence), so lockstep is correct. The source of truth is `package.json`'s `version` field (npm is the project toolchain). Mechanism: the build derives the generated `plugin.json` version from `package.json` at build time, so generated files never drift; a `.version-bump.json` plus a bump script (the superpowers pattern) stamps only the **authored** files — `package.json` and the root `marketplace.json` (`plugins.0.version`). Generated files are never listed in the bump tool.

### 4. Build: adapter registry + `--platform` flag

The build exposes `npm run build -- --platform=<name|all>`, defaulting to `all`. v1 registers only `claude-code`. The flag is surfaced now — it is cheap and expresses the adapter seam from day one. Adding a platform later means registering one adapter, with no change to the build's core loop. This refit replaces the currently hardcoded `version: '0.0.0-dev'` in the build script.

### 5. Distribution: commit the build output

Per-platform build output is committed to `dist/claude-code/` (renamed from the currently gitignored `dist-plugin/`); `.gitignore` flips to track `dist/`. A Claude Code marketplace's relative `source` only resolves when users add the marketplace via git, so the artifact must be committed. The alternatives — a release branch, or a separate distribution repo — were rejected as premature operations for a solo-maintained pre-1.0 project; the chosen structure makes graduating to them later cheap.

### 6. Manifest placement (two `.claude-plugin/` directories, two roots)

- **Root `.claude-plugin/marketplace.json`** — a Claude-Code-only distribution catalog, hand-authored, forced to the repo root by Claude Code convention (`/plugin marketplace add` looks there). Its plugin entry uses `source: "./dist/claude-code"`. Other platforms do not use marketplaces — when Codex/Gemini land they bring their own root-level distribution entry point (e.g. `gemini-extension.json`, `.codex-plugin/`), not an added entry in `marketplace.json`. There is no shared catalog.
- **`dist/claude-code/.claude-plugin/plugin.json`** — build-generated, living inside the artifact (the plugin root that `source` points at). `dist/claude-code/` is a complete, self-contained plugin root (`.claude-plugin/plugin.json` + `skills/` + `agents/` + `bin/` + `templates/`).
- The two manifests are **not** co-located: the root `.claude-plugin/` holds only `marketplace.json`; `plugin.json` lives inside `dist/claude-code/`. (Superpowers co-locates both only because its `source` is `"./"`, making the plugin root equal the repo root; pastiche's plugin root is a subdir because pastiche has a build step.)

## Task breakdown

Tasks 8.1 and 8.2 are specified at phase level (above). Tasks 8.3–8.8 are named and sequenced here; their details are deferred to each task's own spec/grill.

- **8.1 — Repo restructure.** Move files into the `core/ + adapters/ + tools/` layout; relocate the Rust project to `core/tools/pastiche-lint/` and the extractor to `core/tools/extract-fact/`; reduce `scripts/` to build + field-test only. Pure moves plus path fixes (build script, `tsup.config.ts`, `Cargo.toml` location, `.gitignore`, skill `bin/` assumptions). No content changes. Verify the build still produces a working plugin. One atomic task — not split, to avoid a half-moved intermediate state.
- **8.2 — Build + distribution refit.** `--platform` flag + adapter registry; output to the committed `dist/claude-code/`; gitignore flip; generate `plugin.json` from `package.json`; hand-author the root `marketplace.json`; add `.version-bump.json` + bump script. Kept separate from 8.1 because it is different work with different verification ("does it build?" vs. "does the marketplace resolve?").
- **8.3 — LICENSE** (MIT). Independent; can slot anywhere in the sequence.
- **8.4 — README** (positioning, quickstart using the real `/plugin marketplace add` flow, KISA as production adopter).
- **8.5 — Per-document format docs** (fact / knowledge / wisdom / config).
- **8.6 — Adapter docs** (`claude-code.md`; finalize `codex.md`).
- **8.7 — Contributing: adding-an-extractor.**
- **8.8 — Example README showcase** (existing spec at `docs/spec/task-6.5-example-readme.md`, unchanged).

**Sequencing rule:** the restructure (8.1) and build refit (8.2) land first; all documentation tasks come after, so they document the final shape. LICENSE (8.3) is independent of this ordering.

## Invariants

- Change the **form** of prior-phase work only, never its **content**, throughout the phase.
- Maintain the per-concept abstraction line: skills converge (no adapter), agents diverge (canonical body + per-platform adapter).
- Keep the ships-to-adopter boundary: `core/` is the product (including shipped executables under `core/tools/`); `scripts/` is maintainer-only dev tooling.
- Generated files (e.g. the in-artifact `plugin.json`) are never hand-edited or listed in the bump tool — the build owns them.

## Scope boundary

- **In scope:** rewrite the `_dev/docs/TODO.md` Phase 8 block to the 8.1–8.8 shape above, with a dated restructure note (matching the Phase 5 / Phase 6 precedent).
- **Out of scope (deferred to 9.1):** editing `OSS_SPEC.md` itself. The TODO already assigns the OSS_SPEC sweep to 9.1; this phase reads OSS_SPEC as input only.
