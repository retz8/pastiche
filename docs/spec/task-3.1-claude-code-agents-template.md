# Task 3.1 — `adapters/claude-code/agents.template`

Per-task spec for TODO 3.1. Authors the Claude Code agent adapter template that the CLI's Phase 5.2 adapter generator combines with a canonical agent body (`agents/<name>.md`) and its Claude Code sidecar (`agents/<name>.claude-code.meta.yaml`) to emit a final `.claude/agents/<name>.md` file in the adopter's repo. Covers OSS_SPEC §4.2 (canonical sources), §4.3 (adapter templates), §4.4 (output paths), §4.5 (regeneration discipline).

## Scope

- Author `adapters/claude-code/agents.template` per the locked decisions below.
- Amend OSS_SPEC §4.5 to drop the generated-file banner rule entirely (3.2 already scoped it to agents only; 3.1 now removes it from agents too). The remaining §4.5 content — pastiche owns generated files, sync regenerates idempotently, do-not-edit expectation lives in the README — stays.

## Locked decisions

### 1. Template file format — HTML-comment metadata header + plain template body

The template carries its own metadata (currently just the output-path pattern) in a leading HTML comment block (`<!-- pastiche-template ... -->`) parsed by the CLI. The remainder of the file is the literal template body — what an emitted agent file will look like, with substitution placeholders inline. This avoids the visual ambiguity of nested `---` YAML delimiters and keeps the template self-documenting: a maintainer who opens the file sees the emitted shape directly.

### 2. Placeholder syntax — `{{var}}`

Substitutions use Mustache/Handlebars-style `{{var}}`. Universally familiar, no syntactic collision with markdown, YAML frontmatter, or TOML (relevant for symmetry with the forthcoming Codex agents template in 3.3), and trivial to parse.

### 3. `{{name}}` resolution — filename-derived, cross-checked against the sidecar

The CLI derives `{{name}}` from the canonical body's filename (stripping `.md`). It then parses the sidecar's `name` field and cross-checks against the filename-derived value. A mismatch is a fail-loud error. This gives the CLI a simple iteration surface (walk `agents/*.md`) while catching authoring drift between sidecar and body filename early.

### 4. `{{sidecar}}` substitution — verbatim dump

When the template body has the sidecar substitution between frontmatter delimiters, the CLI inserts the sidecar file's contents verbatim — no YAML parsing, no per-field validation, no schema knowledge baked into the generator. The sidecar is the authoring surface; the template is a pass-through wrapper around it. If a future agent needs a new sidecar field, no template change is required. Cost: a malformed sidecar produces a malformed emitted file, which is acceptable because the fix is to edit the sidecar and re-run sync.

### 5. `{{body}}` substitution — verbatim dump

The canonical body is inserted verbatim into the template body. No pre-processing, no normalization, no opinions. The canonical body is the body.

### 6. No generated-file banner on emitted agent files

Emitted agent files ship without an in-file banner comment, matching modern agent and skill convention. The do-not-edit expectation lives in the README, not in the file. OSS_SPEC §4.5's banner rule is dropped entirely; the rest of §4.5 (pastiche owns generated files; sync regenerates idempotently) is unchanged.

## Open items

### Symlink install mode for agents — deferred to Phase 5.2 / Phase 7.1

Symlink install for agents is technically possible but requires the published package to ship pre-composed agent files (canonical body + sidecar composition performed at package-publish time, not at adopter `init` time). The decision between supporting symlink mode for agents (via publish-time composition) and skipping it (writes only for agents; symlink only for skills) is deferred to Phase 5.2 (adapter generator) and Phase 7.1 (packaging). 3.1's template is symlink-mode-agnostic — the same template definition produces the same composed bytes regardless of how the CLI materializes them.
