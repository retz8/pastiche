# pastiche — Claude project instructions

## What this project is

Pastiche is a **Claude skill (and forthcoming OSS package) for faithful design-system execution** by LLM coding agents. Given a frontend task, it produces code that follows an established design system + component library — not by inventing, but by faithfully executing within the established vocabulary.

The skill operates over three documents that form an epistemological hierarchy:

- **FACT.md** — mechanical catalog of every token, component, and prop. Auto-extracted from the codebase.
- **KNOWLEDGE.md** — curated scenario→atom mappings (the "absent designer") + brand-identity prose.
- **WISDOM.md** — atom-tagged rules. Atom-intrinsic only; scenario-conditional rules live in KNOWLEDGE.

The runtime mechanism is a **bounded doubt-defense loop**: a `pastiche-implementer-round1` agent produces code → a `pastiche-reviewer` agent raises strict-YAML doubts → a `pastiche-implementer-round2` agent corrects or defends. The loop is intentionally light; depth comes from the dialogue, not from a heavy reviewer.

Read `_dev/spec.md` for the full philosophical spec. Read `_dev/docs/OSS_SPEC.md` for the v1 OSS delivery spec.

## Current status

This repo is the **OSS extract** of pastiche, validated as an internal installation against the KISA design system (`umichkisa-ds`). Everything currently lives under `_dev/` as a staging area — copied from the working KISA installation but **not yet finalized** for the OSS surface.

The shape of the OSS v1 (per `_dev/docs/OSS_SPEC.md`):

- **CLI:** `pastiche init` · `pastiche sync` · `pastiche lint`
- **User-facing skills:** `pastiche` · `pastiche-setup` · `pastiche-write-knowledge` · `pastiche-write-wisdom`
- **Internal agents:** `pastiche-implementer-round1` · `pastiche-implementer-round2` · `pastiche-reviewer`
- **Templates:** `FACT.md` · `KNOWLEDGE.md` · `WISDOM.md` · `pastiche.config.yaml`
- **Supported platforms:** Claude Code + Codex CLI (Gemini/Cursor/Aider deferred)
- **Adapter model:** canonical sources + per-platform build (no committed per-platform outputs)

## What `_dev/` contains right now

```
_dev/
├── spec.md                          # philosophical spec (ported from KISA)
├── docs/
│   └── OSS_SPEC.md                  # v1 delivery spec (what we're building toward)
├── skills/pastiche/SKILL.md         # the gating-loop skill, copied from KISA's .claude/
├── agents/                          # three subagents, copied from KISA's .claude/agents/
│   ├── pastiche-implementer-round1.md
│   ├── pastiche-implementer-round2.md
│   └── pastiche-reviewer.md
├── scripts/                         # FACT extractor + tag-sanity lint, copied from KISA
│   ├── extract-fact.ts
│   ├── lint-tags.ts
│   └── lint-tags.test.ts
└── templates/                       # FACT / KNOWLEDGE / WISDOM document templates
    ├── FACT.md
    ├── KNOWLEDGE.md
    └── WISDOM.md
```

**Important:** the files in `_dev/` are KISA-flavored copies. They contain KISA paths, KISA atoms, and KISA-specific phrasing in places. The OSS extract requires reviewing each file and generalizing it. Nothing in `_dev/` is canonical yet.

## How to work in this repo

### The review-and-finalize loop

The current task is **reviewing `_dev/` files one by one and promoting them to their final location** at the repo root (per the structure in `_dev/docs/OSS_SPEC.md` §5).

For each file:

1. Read it in `_dev/`.
2. Identify KISA-specific content (paths, atom names, project assumptions, phrasing that presumes the KISA context).
3. Decide: keep, generalize, drop, or split.
4. Write the generalized version to its final location at the repo root (e.g., `_dev/agents/pastiche-reviewer.md` → `agents/pastiche-reviewer.md`; `_dev/skills/pastiche/SKILL.md` → canonical body at `skills/pastiche.md`).
5. Cross-reference against `_dev/docs/OSS_SPEC.md` to ensure the finalized file matches the spec'd v1 shape.
6. Leave the `_dev/` original in place until the OSS extract is complete; clean up `_dev/` as a final step.

### Canonical-source vs adapter-output discipline

Per OSS_SPEC §4: the OSS repo holds **canonical sources** (platform-agnostic markdown bodies — no frontmatter, no platform syntax) plus **adapter templates** that wrap canonical bodies in per-platform envelopes (Claude Code SKILL.md frontmatter; Codex TOML). Pre-built per-platform output files are **not committed** to this repo.

When promoting `_dev/skills/pastiche/SKILL.md` (which has Claude-Code-specific framing today) to the final `skills/pastiche.md`:
- Strip Claude-Code-specific tool names where possible.
- Keep the orchestration logic (round1 → reviewer → round2 → failsafe → emit).
- Move platform-specific concerns into `adapters/claude-code/skills.template`.

Same discipline for `_dev/agents/*.md` → `agents/*.md`: strip frontmatter and Claude-Code-specific scaffolding; promote the prompt body to canonical; let `adapters/<platform>/agents.template` re-wrap.

### Don't invent decisions

The OSS_SPEC is the source of truth for v1 scope, surface, and architecture. If a decision isn't in OSS_SPEC, raise it before implementing — don't infer.

Open implementation decisions are enumerated in OSS_SPEC §14 (extractor pluggability, CLI language, adapter generator implementation, Codex skill format, licensing, package distribution).

### Project-agnostic invariant

Pastiche v1 is **project-agnostic**. KISA is the testbed, not the audience. No file in this repo (canonical or adapter) should embed KISA atom names, KISA file paths, or KISA-specific phrasing. The reference adoption lives at `examples/primer-react/` (not yet built — see OSS_SPEC §12) and is the only place where a real DS's atom names appear in this repo.

## What this repo is not

- **Not a design system.** Pastiche is consumed by an existing design system + component library.
- **Not a general code reviewer.** DS-faithful execution only. Code quality, type checking, and functional correctness belong to other tools.
- **Not a runtime UI generation protocol.** Pastiche operates at build time, producing source code.
- **Not a Claude-Code-only tool.** v1 targets Claude Code + Codex; the architecture explicitly avoids platform lock.

## Reference

- **Origin:** `umichkisa-ds` (the KISA Design System, /Users/jiohin/desktop/kisa/devteam/dev/umichkisa-ds) — the validation testbed. The KISA installation under `umichkisa-ds/pastiche/` and `umichkisa-ds/.claude/{skills,agents}/pastiche*` is the source material for this OSS extract.
