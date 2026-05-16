# Codex CLI Adapter

_Last verified against Codex CLI documentation: 2026-05-16._

This document records how pastiche's canonical sources compile into Codex CLI's native primitives. It resolves OSS_SPEC §14.4.

---

## 1. Codex primitives pastiche uses

Codex CLI exposes three layers relevant to pastiche. Pastiche uses two of them; the third (`AGENTS.md`) is intentionally **not** used.

| Layer | Purpose in Codex | Pastiche uses it for |
|---|---|---|
| **Subagents** (`.codex/agents/*.toml`) | Delegated bounded tasks in isolated context. | The three internal implementers + reviewer. |
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
developer_instructions = """
<canonical agent body from agents/reviewer.md>
"""
# Optional, defaulted by pastiche:
# model = "..."
# model_reasoning_effort = "high"
# sandbox_mode = "read-only"
```

Required: `name`, `description`, `developer_instructions`. The canonical agent body embeds as a triple-quoted string into `developer_instructions` — no separate file reference.

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

- **`agents.template`** — produces a `.toml` file. Wraps the canonical agent body (markdown) inside `developer_instructions = """..."""` with the platform-required `name` and `description` fields. Must escape any triple-quote sequences in the canonical body (none expected, but the generator validates).
- **`skills.template`** — produces `<name>/SKILL.md`. Prepends YAML frontmatter (`name`, `description`) to the canonical skill body. Identical envelope to the Claude Code skills template — only the output path differs (`.agents/skills/<name>/` vs `.claude/skills/<name>/`).

---

## 5. What is not in the Codex adapter

- **No `AGENTS.md` fragment.** Pastiche is on-demand; AGENTS.md is always-loaded. Embedding pastiche there would inflate every Codex turn's context.
- **No tool-name translation.** Canonical agent bodies use neutral vocabulary (Read / Write / Edit / Bash / Glob); Codex exposes the same primitives.
- **No skill `config.toml` registration.** `.agents/skills/` auto-discovery covers project skills without per-user `~/.codex/config.toml` edits.

---

## 6. References

- [Codex CLI — Agent Skills (developers.openai.com)](https://developers.openai.com/codex/skills)
- [Codex CLI — Subagents (developers.openai.com)](https://developers.openai.com/codex/subagents)
- [Codex CLI — AGENTS.md (developers.openai.com)](https://developers.openai.com/codex/guides/agents-md)
- [openai/codex — docs/skills.md (github.com)](https://github.com/openai/codex/blob/main/docs/skills.md)
