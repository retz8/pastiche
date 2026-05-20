# Task 3.2 — No skills adapter (OSS_SPEC §4.3/§4.4/§4.5 amendments)

Per-task spec for TODO 3.2. The deliverable was originally framed as authoring `adapters/claude-code/skills.template`; grilling resolved that no skills adapter is needed for either supported platform. The task ships as a set of OSS_SPEC amendments. TODO 3.4 (Codex skills.template) is closed by the same amendments.

## Scope

- Amend OSS_SPEC §4.3 to remove both `skills.template` entries from the canonical `adapters/` tree, and document why no skills adapter is required.
- Amend OSS_SPEC §4.4 to update the Claude Code skills output location.
- Amend OSS_SPEC §4.5 to scope the generated-file banner rule to agent output only.
- Mark TODO 3.2 done; mark TODO 3.4 done by reference to this spec.

## Locked decisions

### 1. Canonical skill bodies keep their YAML frontmatter (pass-through)

The four canonical skill files under `skills/` (`pastiche.md`, `pastiche-setup.md`, `pastiche-write-knowledge.md`, `pastiche-write-wisdom.md`) carry their `name` / `description` frontmatter on the body itself. No sidecar, no strip-and-re-emit. This is the asymmetry with agents: agent envelopes diverge across platforms (Claude Code `tools:`, Codex `sandbox_mode:`) and require sidecars; skill envelopes are identical across both supported platforms and require none.

### 2. Skills emit to `.agents/skills/<name>/SKILL.md` on both platforms

The Claude Code skill location in OSS_SPEC §4.4 changes from `.claude/skills/<name>/SKILL.md` to `.agents/skills/<name>/SKILL.md`, matching Codex and matching modern cross-tool skill convention. The §4.4 path asymmetry between Claude Code and Codex skills collapses; agent paths remain platform-specific (`.claude/agents/` vs `.codex/agents/`) because those primitives genuinely diverge.

### 3. No skills adapter for any platform

With pass-through frontmatter, a universal output path, and no banner (locked decision 4), there is no envelope to wrap, no path to substitute beyond `<name>`, and no transformation to perform. Skill install is a direct file copy from `skills/<name>.md` to `.agents/skills/<name>/SKILL.md`. The `adapters/` directory exists only for `claude-code/agents.template` and `codex/agents.template`; no `skills.template` is shipped for either platform. The §4.2 "no central mapping table" invariant is preserved — there is nothing to map because skills are a universal cross-tool primitive at a universal location.

### 4. No generated-file banner on skill files

Modern skill packages do not carry generated-file banners; pastiche-installed skills match that convention. The OSS_SPEC §4.5 generated-file banner rule applies to agent output only. Adopter expectations around "pastiche owns these files; do not edit" are documented in the README and surfaced via the plugin install behavior, not via an in-file comment.

## Invariants

- `adapters/` exists only to model genuine platform divergence. After this task, that divergence lives in agent envelopes alone.
- Skills remain platform-agnostic at every layer: canonical body, install location, install behavior.
- OSS_SPEC §4.2's "no central mapping table" rule continues to hold — the universal skill output path is a convention, not a hard-coded mapping.
