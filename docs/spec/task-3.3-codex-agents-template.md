# Task 3.3 — `adapters/codex/agents.template`

Per-task spec for TODO 3.3. Authors the Codex agent adapter template that the CLI's Phase 5.2 adapter generator combines with a canonical agent body (`agents/<name>.md`) and its Codex sidecar (`agents/<name>.codex.meta.yaml`) to emit a final `.codex/agents/<name>.toml` file in the adopter's repo. Covers OSS_SPEC §4.2/§4.3/§4.4 and the Phase 0 Codex adapter contract at `docs/adapters/codex.md`. Inherits 3.1's locked template conventions.

## Scope

- Author `adapters/codex/agents.template` per the locked decisions below.
- Apply targeted updates to `docs/adapters/codex.md`:
  - §4 collapsed to a single `agents.template` bullet, with the TOML string type and validation language corrected per locked decisions 2 and 3.
  - §2 gains a one-sentence note that skills are emitted by direct copy (no per-platform Codex template).

## Locked decisions

### 1. YAML sidecar → TOML structural conversion at substitution time

The template uses a single placeholder for the converted sidecar block. The CLI parses the sidecar YAML and re-emits each field as a TOML key=value line at that placeholder. The template does not enumerate expected fields, and Codex sidecars are not stored in TOML directly — sidecars stay YAML for symmetry with the Claude Code sidecar shape, and schema decoupling stays intact (adding a new sidecar field requires no template change). YAML comments in the sidecar are not preserved in the emitted TOML; this aligns with the "no in-file banner" decision inherited from 3.1.

### 2. Canonical body embeds as a TOML literal multi-line string (`'''…'''`)

`developer_instructions` uses TOML's literal multi-line string delimiter (`'''…'''`) rather than the basic multi-line delimiter (`"""…"""`). Markdown agent bodies contain backslashes (regex examples, code blocks) that would require escape processing under `"""` but are passed through as-is under `'''`. The forbidden sequence under `'''` is `'''` itself — extremely unlikely in natural markdown.

### 3. Validation on the forbidden sequence — fail-loud, no auto-escape

The CLI scans each canonical agent body for the literal sequence `'''` at adapter-emit time. If present, the adapter generator aborts with a directive error naming the offending body. No auto-escape, no silent transformation. The check protects authoring discipline: a future canonical body that would silently break Codex TOML embedding is caught at the time the canonical body is being authored, not at adopter install time.

### 4. Body framing inside the TOML string

The canonical body sits flush-left between the delimiters, with a newline immediately after the opening `'''` and immediately before the closing `'''`. No indentation prefix is added; the body retains whatever trailing newline the canonical file carries. TOML's line-ending normalization handles the post-opening newline cleanly.

### 5. `docs/adapters/codex.md` cleanup — surgical, not a rewrite

The Phase 0 doc's "Last verified" timestamp is a contract that surgical changes preserve. The cleanup is scoped to:
- §4: collapse the two-template list to a single `agents.template` bullet; update the TOML string type from `"""` to `'''`; replace the "escape any triple-quote sequences" language with the fail-loud rule from locked decision 3.
- §2: append one sentence noting that skills are emitted by direct copy and no per-platform Codex skills template exists.

§1, §3, §5, §6, §7, and the placeholder/unverified status banner stay untouched. The wider Codex CLI contract (subagent discovery, file shape, tool-restriction reference) is unaffected by 3.x amendments.

## Invariants

- 3.3 inherits 3.1's full template-format invariants: Shape B HTML-comment metadata header, `{{var}}` substitution syntax, filename↔sidecar `name` cross-check, verbatim canonical body, no in-file generated-status banner.
- Codex sidecars remain YAML at the canonical source layer. The adapter template is the only place where YAML→TOML structural conversion happens; the conversion is structural (field shape), not semantic (no value translation).

## Open items

### Symlink install mode for agents — deferred to Phase 5.2 / Phase 7.1

Same as 3.1's open item: symlink install for Codex agents is technically possible but requires the published package to ship pre-composed `.codex/agents/<name>.toml` files. Decision deferred to Phase 5.2 (adapter generator) and Phase 7.1 (packaging). 3.3's template is symlink-mode-agnostic.
