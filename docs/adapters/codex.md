# Codex CLI Adapter

_Last verified against Codex CLI documentation: 2026-05-16._

> **Status in v1: placeholder, unverified.** The author lacks Codex CLI access. The contents of this document, the per-agent `.codex.meta.yaml` sidecars, and the Codex adapter template ship in v1 but have not been exercised end-to-end. Community validation invited. See OSS_SPEC §2.2.

This document records how pastiche's canonical sources compile into Codex CLI's native primitives. It resolves OSS_SPEC §14.4.

---

## 1. Codex primitives pastiche uses

Codex CLI exposes three layers relevant to pastiche. Pastiche uses two of them; the third (`AGENTS.md`) is intentionally **not** used.

| Layer | Purpose in Codex | Pastiche uses it for |
|---|---|---|
| **Subagents** (`.codex/agents/*.toml`) | Delegated bounded tasks in isolated context. | The three internal subagents (`pastiche-implementer-round1`, `pastiche-implementer-round2`, `pastiche-reviewer`). |
| **Skills** (`.agents/skills/<name>/SKILL.md`) | Repeatable workflows, implicit- or explicit-invocable. | The four user-facing skills (`pastiche`, `pastiche-setup`, `pastiche-write-knowledge`, `pastiche-write-wisdom`). |
| **AGENTS.md** | Always-loaded project-wide conventions. | **Not used.** Pastiche is invoked on-demand; always-loading its orchestrator body would pollute every Codex session in the adopter's repo. |

Note the path asymmetry: skills live under `.agents/skills/` (a Codex convention designed to be portable across agent shells), while subagents live under `.codex/agents/` (Codex-specific).

---

## 2. Skills

### 2.1 Discovery

Codex scans `.agents/skills/` walking up from the current working directory to the repo root, plus the user's `~/.agents/skills/`. Pastiche installs into the repo root: `<repo>/.agents/skills/`.

### 2.2 File shape

Each skill is a directory containing a `SKILL.md` with YAML frontmatter:

```markdown
---
name: pastiche
description: <trigger-condition prose — controls implicit invocation>
---

<canonical orchestrator body from skills/pastiche.md>
```

Required frontmatter keys: `name`, `description`. The body is markdown — pastiche's canonical skill bodies drop in unchanged.

### 2.3 Invocation

- **Implicit:** Codex auto-selects skills whose `description` matches the user's prompt.
- **Explicit:** `$<skill-name>` in a prompt, or `/skills` in the CLI/IDE.

Pastiche skill descriptions are written as trigger conditions (not titles) per Codex guidance.

### 2.4 Output locations

```
.agents/skills/
├── pastiche/SKILL.md
├── pastiche-setup/SKILL.md
├── pastiche-write-knowledge/SKILL.md
└── pastiche-write-wisdom/SKILL.md
```

---

## 3. Subagents

### 3.1 Discovery

Codex reads `.codex/agents/*.toml` (project) and `~/.codex/agents/*.toml` (personal). Pastiche writes the project-scope variant.

### 3.2 File shape

```toml
name = "pastiche-reviewer"
description = "<one-line guidance for when Codex should spawn this agent>"
model = "gpt-5-codex"
sandbox_mode = "read-only"
developer_instructions = """
<canonical agent body from agents/pastiche-reviewer.md>
"""
```

Required: `name`, `description`, `developer_instructions`. Optional: `model`, `sandbox_mode`, `approval_policy`, `[mcp_servers.*]`. The canonical agent body embeds as a triple-quoted string into `developer_instructions` — no separate file reference.

Field values are sourced from the per-agent **Codex sidecar** at `agents/<name>.codex.meta.yaml`. The adapter does no translation; the sidecar already carries Codex-native field names.

### 3.3 Output locations

```
.codex/agents/
├── pastiche-implementer-round1.toml
├── pastiche-implementer-round2.toml
└── pastiche-reviewer.toml
```

### 3.4 Spawning

Subagents are spawned by natural-language delegation from the orchestrator skill. The `pastiche` skill's orchestration body dispatches by agent `name`.

---

## 4. Adapter template responsibilities

The adapter under `adapters/codex/` owns two templates:

- **`agents.template`** — produces a `.toml` file. Reads the per-agent Codex sidecar (`agents/<name>.codex.meta.yaml`), wraps the canonical agent body inside `developer_instructions = """..."""`, and emits every sidecar field verbatim as a top-level TOML key (`name`, `description`, `model`, `sandbox_mode`, etc.). Must escape any triple-quote sequences in the canonical body (none expected, but the generator validates).
- **`skills.template`** — produces `<name>/SKILL.md`. Prepends YAML frontmatter (`name`, `description`) to the canonical skill body. Identical envelope to the Claude Code skills template — only the output path differs (`.agents/skills/<name>/` vs `.claude/skills/<name>/`).

---

## 5. What is not in the Codex adapter

- **No `AGENTS.md` fragment.** Pastiche is on-demand; AGENTS.md is always-loaded. Embedding pastiche there would inflate every Codex turn's context.
- **No per-tool allowlist.** Codex has no field analogous to Claude Code's `tools:` frontmatter (confirmed against `RawAgentRoleFileToml` in the Codex source — see §6). Tool restriction is sandbox-mode-only, and pastiche's Codex sidecars carry `sandbox_mode` directly.
- **No skill `config.toml` registration.** `.agents/skills/` auto-discovery covers project skills without per-user `~/.codex/config.toml` edits.

---

## 6. Codex tool-restriction reference

This section documents what Codex's TOML schema actually exposes — recorded so future contributors don't repeat the Phase 0 lookup. It is descriptive, not a mapping table; pastiche's Codex sidecar carries Codex-native fields directly and the adapter does no translation.

**No per-tool allowlist.** Codex CLI subagent TOML has no field analogous to Claude Code's `tools: Read, Edit, Write, Bash, Glob` frontmatter. `RawAgentRoleFileToml` (`codex-rs/core/src/config/agent_roles.rs`) uses `deny_unknown_fields` and `#[serde(flatten)]`s `ConfigToml`. The only `[tools]` table key is `web_search` (a single boolean). There is no `tools = [...]` allowlist for built-in tools (shell / apply_patch / read / etc.).

**Tool access in Codex is governed by:**
- `sandbox_mode` — `"read-only"` | `"workspace-write"` | `"danger-full-access"`
- `approval_policy` — `"never"` | `"on-failure"` | `"on-request"` | `"untrusted"`
- `[mcp_servers.*]` — per-agent MCP server scoping
- `model` / `model_reasoning_effort`

**Pastiche's choice.** Each agent's Codex sidecar (`agents/<name>.codex.meta.yaml`) carries `sandbox_mode` directly. Read-only agents like `pastiche-reviewer` get `"read-only"`; implementer agents that write code get `"workspace-write"`. Pastiche does not attempt to fake per-tool gating via MCP scoping or other indirection — that path is not honest and adds maintenance surface for no win. The fidelity gap relative to Claude Code's per-tool allowlist is acknowledged and lives at the sidecar layer.

**Sources (verified 2026-05-16):**
- https://github.com/openai/codex/blob/main/codex-rs/core/src/config/agent_roles.rs (`RawAgentRoleFileToml`)
- https://github.com/openai/codex/blob/main/codex-rs/config/src/config_toml.rs (`ConfigToml`, `ToolsToml`)
- https://developers.openai.com/codex/subagents

---

## 7. References

- [Codex CLI — Agent Skills (developers.openai.com)](https://developers.openai.com/codex/skills)
- [Codex CLI — Subagents (developers.openai.com)](https://developers.openai.com/codex/subagents)
- [Codex CLI — AGENTS.md (developers.openai.com)](https://developers.openai.com/codex/guides/agents-md)
- [openai/codex — docs/skills.md (github.com)](https://github.com/openai/codex/blob/main/docs/skills.md)
