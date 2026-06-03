# Roadmap

*Forward-looking directions, not commitments or a timeline.*

## Planned

- **Framework support beyond React** — the FACT extractor reads React component types only; Vue (`defineProps`) and Angular (`@Input` classes) need discovery passes emitting the same FACT.md shape.
- **Additional agent platforms** — Codex (verify the shipped placeholder), OpenCode, Cursor.
- **Multi-arch lint distribution** — restore the lint safety net on non-darwin/arm64 adopters (per-arch CI builds or compile-on-install).
- **Research-from-docs setup mode** — a `/pastiche-research-ds-docs` skill that crawls a design system's public docs into a structured research file, fed to setup as an optional source.

## Open questions

- **Aesthetic review skill** — an on-demand, non-gating pass for designer judgment (pacing, hierarchy, brand fit) that loads Brand Identity plus general UI/UX knowledge.
- **Two- vs three-round loop** — v1 caps at two implementer rounds; bump to three with a final-round exit ritual if late-surfacing issues slip through.
- **Speculative-doubt calibration** — how the reviewer persona prompt evolves as real runs surface noisy or missed doubts.
- **Strong-no abuse mitigation** — v1 trusts the persona; add a reviewer re-flag round if systemic over-defense shows up.
- **Reverse KNOWLEDGE** — auto-generating `[atoms] → scenario` inverses into WISDOM to harden failure-mode-C detection; deferred unless speculative doubt proves insufficient.
- **KNOWLEDGE curation cost** — how much effort a mature DS team needs to keep KNOWLEDGE useful, and whether the strong-no loop keeps it incremental.
