# Phase 4 — Scripts

Phase-level spec for the two scripts in Phase 4 of `_dev/docs/TODO.md`: the FACT extractor (4.1) and the lint (4.2). Per-task grills inherit from this spec.

## Scope

Phase 4 promotes the two `_dev/scripts/` files into top-level `scripts/` as the generalized, project-agnostic versions:

- **4.1** — promote the FACT extractor and generalize per OSS_SPEC §9.4 / §9.4.1: support both `packages` input modes (`types` aggregate `.d.ts` and `source_dir` source-walk) and both `tokens` formats (`tailwind-v4-theme` and `css-vars`); add source-directory walking and plain `:root` CSS-vars parsing; strip KISA-specific assumptions.
- **4.2** — promote the lint and its test; add KNOWLEDGE canonical-section-presence enforcement per OSS_SPEC §6.3 step 4.

## Locked decisions

### 1. Distribution model: Claude plugin only for v1

Pastiche v1 ships as a Claude Code plugin only. No npm package, no global CLI binary, no Rust. The headline of the project is the `pastiche` skill; the bootstrap, sync, and lint surfaces are slash commands inside the plugin, not standalone CLI commands.

### 2. Phase 4 consumer: skill bodies, not a CLI

Both scripts are consumed by skill bodies (`/pastiche-init`, `/pastiche-sync`, `/pastiche-lint`) invoked inside Claude Code. There is no `pastiche init`, `pastiche sync`, or `pastiche lint` CLI command in v1. The "CLI" envisioned in earlier OSS_SPEC drafts is collapsed into the plugin's slash-command catalog.

### 3. Authoring language: TypeScript, no Rust

Both scripts stay in TypeScript. The extractor's dependency on the TypeScript type checker (via ts-morph) is load-bearing — semantic features such as `VariantProps<typeof X>` expansion, recursive `Omit<>` flattening, and literal-union inlining cannot be reproduced in Rust without reimplementing a type checker or losing those features. Rust was considered for the CLI/lint alone but rejected because the user-facing speed gain is modest and the multi-platform release pipeline cost outweighs it under plugin-first distribution.

### 4. Bun is dev tooling only

Bun is used during development for fast TypeScript execution, tests, and bundling. It is not a runtime requirement for adopters. Adopters need Node (for the bundled JS subprocess invoked by skill bodies). Nothing in the plugin requires Bun on the adopter machine.

### 5. Script shape: library + guarded `main()`

Both scripts are authored as libraries with a guarded `main()` entry. The library exports power the test suite and the bundled JS the plugin ships; `main()` is preserved so the scripts remain directly executable for development.

### 6. Plugin-mode init skips adapter generation

Under plugin-first distribution, the plugin already provides skills and agents globally. `/pastiche-init` therefore creates only the per-project `pastiche/` directory (FACT, KNOWLEDGE, WISDOM, config) and does not write `.claude/skills/...` or `.claude/agents/...` into the adopter repo. This differs from the earlier dual-distribution model.

### 7. Rule 5 deletions in-phase

The ported `_dev/scripts/` sources are deleted in the same commit as their respective ports. `_dev/scripts/extract-fact.ts` is removed by 4.1. `_dev/scripts/lint-tags.ts` and `_dev/scripts/lint-tags.test.ts` are removed by 4.2. The `_dev/scripts/` directory is removed once empty.

## Invariants

- Canonical sources stay platform-agnostic. Neither script embeds KISA atom names, paths, or phrasing.
- Skill bodies invoke scripts as Node subprocesses via the plugin root (resolved at runtime); no hard-coded paths to `~/.claude/plugins/pastiche/`.

## Open items

These were raised and explicitly deferred during the grill. They do not block Phase 4 and are not resolved by this spec.

1. **Codex support.** Codex is not a Claude plugin. Either ship pastiche for Codex via a separate package post-v1, or demote OSS_SPEC §2.2 and Phase 3.3 to v1.x. v1 acceptance is Claude Code only.
2. **CI lint.** Plugin-only v1 has no GitHub Actions story for `pastiche lint`. Resolution path surfaced during the grill: implement lint as a Claude Code hook (adopter-side enforcement at edit time) rather than a CI step. Design happens in Phase 5 or Phase 7, not Phase 4.
3. **OSS_SPEC sweep.** Sections affected by the plugin-first pivot (§6 CLI commands, §14.2 CLI language, §14.6 distribution, §15 #5 CI lint acceptance, §2.2 / Phase 3.3 Codex) are updated in Phase 8.1's dedicated spec-editing pass, not in Phase 4.
