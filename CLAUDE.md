# pastiche

## What this project is

Pastiche is a **Claude skill (and forthcoming OSS package) for faithful design-system execution** by LLM coding agents. Given a frontend task, it produces code that follows an established design system + component library — not by inventing, but by faithfully executing within the established vocabulary.

The skill operates over three documents that form an epistemological hierarchy:

- **FACT.md** — mechanical catalog of every token, component, and prop. Auto-extracted from the codebase.
- **KNOWLEDGE.md** — curated scenario→atom mappings (the "absent designer") + brand-identity prose.
- **WISDOM.md** — atom-tagged rules. Atom-intrinsic only; scenario-conditional rules live in KNOWLEDGE.

The runtime mechanism is a **bounded doubt-defense loop**: `pastiche-implementer-round1` produces code → `pastiche-reviewer` raises strict-YAML doubts → `pastiche-implementer-round2` corrects or defends. Depth comes from the dialogue, not from a heavy reviewer.

**Required reading:** `spec.md` (philosophy), `_dev/TODO.md` (post-v1 backlog).

## How to work in this repo

### Invariants

- **Project-agnostic.** No canonical or adapter file embeds KISA atom names, paths, or phrasing. KISA atoms only appear in `examples/primer-react/` (the reference adoption — not yet built, see OSS_SPEC §12).
- **Canonical vs adapter discipline**: canonical sources are platform-agnostic markdown bodies; per-platform envelopes live in `adapters/<platform>/*.template`; built outputs are not committed.

### What this repo is not

Not a design system, not a general code reviewer, not a runtime UI protocol, not Claude-Code-only. v1 targets Claude Code + Codex.
