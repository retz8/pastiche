# Claude Code adapter

How pastiche's platform-agnostic agent bodies become a Claude Code plugin.

Pastiche keeps its three agents as **canonical bodies** — plain Markdown with no platform framing — under `core/agents/`. Claude Code needs each agent as a single Markdown file with YAML frontmatter. The Claude Code adapter is the seam that bridges the two: it wraps a canonical body in the frontmatter Claude Code expects, and the build script applies it to produce the shipped plugin.

Skills need no such envelope — `SKILL.md` is already the format Claude Code reads, so skills are copied verbatim. Only agents are adapted.

## What the adapter is

The adapter is a single template at `adapters/claude-code/agents.template`:

```
<!-- pastiche-template
output_path: .claude/agents/{{name}}.md
-->
---
{{sidecar}}
---

{{body}}
```

It has two parts:

- A leading `pastiche-template` comment carrying adapter metadata (the `output_path` convention for a standalone install). The build strips this comment before rendering.
- The body: a YAML frontmatter block followed by the agent text. Two placeholders get substituted per agent — `{{sidecar}}` and `{{body}}`.

The frontmatter content comes from a per-agent **sidecar** next to the canonical body: `core/agents/<name>.claude-code.meta.yaml`. The sidecar already holds Claude Code's native frontmatter fields, so the adapter does no field translation — it drops the sidecar in as-is:

```yaml
name: pastiche-reviewer
description: Raises design-system doubts on a round-1 implementation by checking it against FACT.md and WISDOM.md.
model: sonnet
tools: [Read, Bash, Glob]
```

`model` pins the agent's model (per-role: Opus for the round-1 implementer, Sonnet for round-2 and the reviewer), and `tools` is Claude Code's per-agent tool allowlist. Keeping these in the sidecar means model and tool policy live beside the body but stay out of the platform-agnostic body itself.

## How the build assembles it

`scripts/build.ts` builds the plugin for a platform (`npm run build -- --platform=claude-code`; `all` is the default and v1 registers only `claude-code`). For each canonical agent it:

1. Reads the template once and strips the `pastiche-template` comment.
2. For every `core/agents/<name>.md` that has a matching `<name>.claude-code.meta.yaml` sidecar, substitutes the sidecar into `{{sidecar}}` and the body into `{{body}}`.
3. Writes the result to the plugin's `agents/<name>.md`. A canonical body with no Claude Code sidecar is skipped.

The rest of the plugin is assembled alongside the rendered agents — no template involved:

| Output | Source | How |
|---|---|---|
| `agents/<name>.md` | `core/agents/` body + sidecar | rendered through the template |
| `skills/<name>/SKILL.md` | `core/skills/<name>.md` | copied verbatim |
| `templates/*` | `core/templates/` | copied verbatim |
| `dist/extract-fact.js` + `bin/extract-fact` | `core/tools/extract-fact/` | bundled (tsup) + shell wrapper |
| `bin/pastiche-lint` | `core/tools/pastiche-lint/` | compiled (`cargo build --release`) |
| `.claude-plugin/plugin.json` | `package.json` | generated from package metadata |

Everything lands under `dist/claude-code/`, which is the publishable Claude Code plugin.

## Worked example

The reviewer agent, end to end.

**Canonical body** — `core/agents/pastiche-reviewer.md` (platform-agnostic, no frontmatter):

```markdown
# Pastiche Reviewer

You are a senior UI/UX designer with deep fluency in this project's design system…
```

**Sidecar** — `core/agents/pastiche-reviewer.claude-code.meta.yaml`:

```yaml
name: pastiche-reviewer
description: Raises design-system doubts on a round-1 implementation by checking it against FACT.md and WISDOM.md.
model: sonnet
tools: [Read, Bash, Glob]
```

**Rendered output** — `dist/claude-code/agents/pastiche-reviewer.md` (sidecar as frontmatter, body unchanged):

```markdown
---
name: pastiche-reviewer
description: Raises design-system doubts on a round-1 implementation by checking it against FACT.md and WISDOM.md.
model: sonnet
tools: [Read, Bash, Glob]
---

# Pastiche Reviewer

You are a senior UI/UX designer with deep fluency in this project's design system…
```

## References

- [Subagents](https://code.claude.com/docs/en/sub-agents) — the agent frontmatter format (`name`, `description`, `model`, `tools`) the template produces.
- [Plugins](https://code.claude.com/docs/en/plugins) — the plugin layout (`.claude-plugin/plugin.json`, `agents/`, `skills/`, `bin/`) the build emits into `dist/claude-code/`.
