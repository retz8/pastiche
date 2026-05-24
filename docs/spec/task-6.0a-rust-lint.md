# Task 6.0a — Rust lint binary

Rewrite `scripts/lint.ts` as a Rust binary (`pastiche-lint`), update skill bodies, delete superseded TS sources.

## Locked decisions

1. **Rust project location**: `rust/pastiche-lint/` at repo root. Separate Rust workspace with its own `Cargo.toml`, `src/`, `target/` (gitignored).

2. **Binary name**: `pastiche-lint`. Placed in `dist-plugin/bin/pastiche-lint` by the build script. Since `bin/` contents are added to PATH by Claude Code, skills call `pastiche-lint` by name with no path prefix.

3. **Canonical sections**: Embedded directly in the Rust binary. Ported from `scripts/canonical-sections.ts` (pure data — two arrays of strings). Single source of truth moves to Rust; the TS file is deleted.

4. **Behavioral contract**: Exact same exit codes (0 = clean, 1 = violations), stdout/stderr split (summary → stdout, violations → stderr), and output format (plain text, `file:line message`) as the original `lint.ts`.

5. **Crate dependencies**: `serde` + `serde_yaml` (YAML parsing for config.yaml), `regex` (pattern matching), `tempfile` (dev dependency for tests only). Minimal set, no async, no heavy frameworks.

6. **Test strategy**: Port all test cases from `scripts/lint.test.ts` (716 lines) and `scripts/canonical-sections.test.ts` (63 lines) to Rust `#[test]`s using `tempfile` crate for temp directories. Same cases, same assertions. `cargo test` runs separately from `build.ts` — build script is not a test runner.

7. **TS source deletion**: After successful port, delete `scripts/lint.ts`, `scripts/lint.test.ts`, `scripts/canonical-sections.ts`, `scripts/canonical-sections.test.ts`. Git history is the audit trail (per CLAUDE.md Rule 5).

8. **Skill wording sweep**: Replace `node $CLAUDE_PLUGIN_ROOT/dist/lint.js` → `pastiche-lint` in five skill bodies: `skills/pastiche-lint.md`, `skills/pastiche-sync.md`, `skills/pastiche-setup.md`, `skills/pastiche-write-knowledge.md`, `skills/pastiche-write-wisdom.md`.

9. **package.json**: Add `"test:lint": "cargo test --manifest-path rust/pastiche-lint/Cargo.toml"` convenience script.

10. **.gitignore**: Add `rust/pastiche-lint/target/` entry.
