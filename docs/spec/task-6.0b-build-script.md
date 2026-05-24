# Task 6.0b — Build script + plugin packaging

Build a `scripts/build.ts` orchestrator (run via `tsx`) that produces a `dist-plugin/` directory containing the loadable shape of pastiche as a Claude Code plugin.

## Locked decisions

1. **Plugin name**: `"pastiche"` in `plugin.json`. Skills are namespaced as `/pastiche:<skill-name>` (e.g. `/pastiche:pastiche-init`). Skill renaming (to drop the redundant `pastiche-` prefix) deferred to a later discussion.

2. **`plugin.json` — minimal manifest**: Only three fields for v1:
   ```json
   {
     "name": "pastiche",
     "description": "Faithful design-system execution for LLM coding agents",
     "version": "0.0.0-dev"
   }
   ```
   Phase 8 later adds `marketplace.json`, author, homepage, etc.

3. **Plugin directory structure** (per Claude Code plugin spec):
   ```
   dist-plugin/
   ├── .claude-plugin/
   │   └── plugin.json          ← only manifest goes here
   ├── skills/<name>/SKILL.md   ← one directory per skill
   ├── agents/<name>.md         ← rendered agent files
   ├── templates/*              ← copied as-is
   ├── dist/extract-fact.js     ← bundled JS (tsup)
   └── bin/pastiche-lint        ← compiled Rust binary
   ```

4. **Agent rendering**: Canonical body (`agents/<name>.md`) + Claude Code sidecar (`agents/<name>.claude-code.meta.yaml`) → rendered through `adapters/claude-code/agents.template` → output at `dist-plugin/agents/<name>.md`. This is the existing adapter design.

5. **Skill copying**: Canonical skill files (`skills/<name>.md`) copied as-is into the plugin directory structure: `skills/<name>.md` → `dist-plugin/skills/<name>/SKILL.md`. Content unchanged, only path restructured. No per-platform adapter for skills.

6. **Templates**: All four template files copied to `dist-plugin/templates/`: `config.yaml`, `FACT.md`, `KNOWLEDGE.md`, `WISDOM.md`. Skills reference them via `$CLAUDE_PLUGIN_ROOT/templates/*`.

7. **JS bundling**: `tsup` with a separate `tsup.config.ts` config file. Only bundles `scripts/extract-fact-ts.ts` → `dist-plugin/dist/extract-fact.js` (lint is now a Rust binary in `bin/`, not bundled JS). The `tsup` entry point is configured with an explicit output name so `extract-fact-ts.ts` produces `extract-fact.js` (not `extract-fact-ts.js`).

8. **Rust binary integration**: `build.ts` shells out to `cargo build --release --manifest-path rust/pastiche-lint/Cargo.toml` and copies the binary from `rust/pastiche-lint/target/release/pastiche-lint` → `dist-plugin/bin/pastiche-lint`.

9. **One-command build**: `npx tsx scripts/build.ts` produces a complete `dist-plugin/`. No partial builds, no manual steps. If Cargo isn't installed, it fails with a clear error.

10. **`dist-plugin/` is gitignored**: Built output is not committed. Regenerated on demand.

11. **.gitignore**: Add `dist-plugin/` entry (in addition to `rust/pastiche-lint/target/` from 6.0a).
