# Task 2.7 — `skills/pastiche-setup.md`

Per-task spec for TODO 2.7. Authors the canonical body of `skills/pastiche-setup.md` — the first-time adoption skill invoked after `pastiche init`. Inherits from `docs/spec/phase-2-templates-and-skills.md`. Covers OSS_SPEC §7.2 and §11.

## Scope

- Author `skills/pastiche-setup.md` per the locked decisions below.
- Trim downstream references made redundant by locked decision 7 (the `[GENERAL]` canonical seeds now live inside the setup skill, not the WISDOM template):
  - Remove the commented `[GENERAL]` example block from `templates/WISDOM.md`.
  - Trim `_dev/docs/OSS_SPEC.md` §6.1 (drop "+ commented-out `[GENERAL]` suggestions" from the init scaffold description).
  - Trim `_dev/docs/OSS_SPEC.md` §9.3 (drop the example block from the illustrative WISDOM template).
  - Amend `docs/spec/phase-2-templates-and-skills.md` locked decision 5 (drop the "Commented-out `[GENERAL]` suggestions" sub-bullet from WISDOM shape).

## Locked decisions

### 1. DESIGN.md handling is minimal

Path-safety only on read: resolve absolute, in-repo, readable, ≤200KB soft cap. Failure → warn and proceed as if `null`.

One structural probe on the file body: scan for `^## Overview` or `^## Brand & Style`. If either heading is present, that section's body is the source for the one mechanical action (locked decision 6's auto-port). If neither is present, the auto-port is silently skipped — Brand Identity falls through to the no-auto-port path.

No format validation, no schema check, no token cross-reference. The consumer is responsible for bringing a coherent DESIGN.md. Richer awareness of Google Labs' published DESIGN.md format is explicitly deferred to a future version.

### 2. DESIGN.md's role is candidate-mining, not cross-reference

FACT.md is vocabulary (atom names); DESIGN.md is content (narrative). Setup pre-stages candidate KNOWLEDGE scenarios and `[GENERAL]` WISDOM rules drawn from DESIGN.md narrative, tagged with FACT atoms. The consumer reviews drafts; they don't answer blind questions.

OSS_SPEC §11.2's "token cross-reference" framing is dropped — FACT defines what tokens exist; there is nothing to cross-reference against.

Canonical seeds (locked decisions 5c and 7b) always apply alongside DESIGN.md narrative. DESIGN.md does not replace seeds; it augments them. The skill body carries the seed material in every adoption, not just DESIGN.md-less ones.

### 3. The entry shape is a guided conversation, not a dashboard

The consumer is not "re-invoking pastiche-setup" — they are continuing setup they paused. The skill remembers where they were via `setup_progress` in `pastiche/config.yaml`.

**First-run flow:**

1. Two-line greet.
2. DESIGN.md handshake (the first concrete ask, before anything else): scan repo root for DESIGN.md and either ask opt-in or note that we'll go through this from scratch. On opt-in, write `design_md_reference` and auto-port brand prose if locked decision 1's probe found `## Overview` / `## Brand & Style`.
3. Brand Identity section first.
4. Roll forward section by section.
5. Wrap on the invocation that flips the last stub.

**Returning-run flow:**

No greeting. No DESIGN.md re-ask (state is already in config). One-line status (e.g., "Picking up where we left off — 4 of 13 done. Next up: Forms & input collection. Continue?") and resume.

### 4. Section cadence: explicit continue / switch / pause between sections

Between sections, the skill explicitly offers three choices: continue to the next section, switch to a different section, or pause. The explicit prompt is the friendly default — it tells the consumer they are allowed to pause.

Flags are escape hatches, not the primary surface:

- `--section <name>` — jump straight to a specific section (revising a `filled` section or skipping ahead).
- `--all` — same flow, but skip the inter-section "continue / switch / pause" prompts.
- No `--resume` flag — that is the default behavior on a partial state.

### 5. Per-section flow for the 11 scenario sections

**5a. Review granularity.** Bulk-per-section. The skill drafts all candidate scenarios for the section in one go as a numbered list. The consumer responds in natural language (accept some, reject some, edit some, add new ones). The skill writes once after agreement.

**5b. Candidate count.** Soft target of 5–8 per section, no hard cap, no padding. The LLM judges based on DESIGN.md narrative depth × atom variety in FACT for that section. If only three are well-supported, draft three.

**5c. Canonical seed scenarios.** The skill body embeds canonical seed scenarios per section (drawn from philosophical spec §3.2's 12 sections). The LLM adapts seeds to the adopter's FACT — drops seeds whose atoms are not in FACT, adds seeds suggested by FACT atoms that don't map to a canonical seed. When DESIGN.md is present, the seeds blend with mined DESIGN.md candidates; when DESIGN.md is absent, the seeds carry the section alone.

### 6. Brand Identity section flow

**6a. With auto-port (locked decision 1's probe succeeded).** Show the ported prose verbatim and offer `keep / edit / rewrite`. `edit` accepts natural-language patches; `rewrite` drops the port and falls through to 6b.

**6b. Without auto-port.** Default is freeform: the consumer pastes or writes the Brand Identity prose directly. The initial prompt advertises both paths so the consumer sees the help path on turn one without having to discover it by failing first: a freeform default plus a "Not sure where to start? Say 'guide me' and I'll walk you through 4–5 prompts to draft it together" line.

The seed-questions fallback covers brand voice, density posture, restraint signal, the one rule that makes a screen feel off-brand, and an optional anti-example.

**6c. Read-back.** Single read-back of the final prose block, natural-language edits, one round-trip. Then write and flip `filled`.

### 7. `[GENERAL]` WISDOM phase

**7a. Flow.** Bulk-per-phase parity with locked decision 5a. The skill drafts a batch of candidate `[GENERAL]` rules — from DESIGN.md narrative (especially any "Do's and Don'ts"-shaped content) plus canonical seeds. Consumer responds in natural language. One round-trip, then write to WISDOM.md.

**7b. Canonical seed candidates (4).** Tokens-only (never raw hex / px); spacing scale discipline (no arbitrary gap / padding values); breakpoint discipline (no arbitrary media queries); accessibility floors (contrast / focus-visible / semantic HTML). Landmark structure is dropped from the seed set.

**7c. Gating discipline.** Trust the canonical seeds — they are pre-vetted as system-wide. Apply the `[GENERAL]` gate (tag-fit + system-wide tests, per `pastiche-write-wisdom`) only to DESIGN.md-mined candidates, to catch scenario-conditional leakage. A failed DESIGN.md-mined candidate is flagged with the same redirect language as `pastiche-write-wisdom` (suggest re-routing to KNOWLEDGE during the relevant section).

**7d. Position.** Strictly last in the flow, after all 12 KNOWLEDGE stubs are `filled`. Composes cleanly with the wrap.

### 8. Lint cadence

`pastiche lint` runs after every section write. On failure, the lint output is surfaced verbatim; the section content is not reverted, the `setup_progress` flip is not rolled back, and the continue / switch / pause prompt is not blocked. Matches the behavior of the sibling `pastiche-write-knowledge` / `pastiche-write-wisdom` skills.

### 9. `setup_progress` flip timing

`setup_progress.<section>` flips `stub → filled` eagerly, immediately after the section's content is written. The flip is a process marker ("we walked this section"), not a quality gate ("this section is lint-clean"). Quality is the lint's job; `setup_progress` records the walk.

### 10. Wrap message

Fires on the invocation that lands the final `filled` flip — including a `--section` invocation, not just an end-of-walk continue. Catching the milestone in real time is friendlier than making the consumer notice it themselves.

Content: completion line + light stats (sections filled, scenarios authored, `[GENERAL]` rules added) + a lint summary (only if any sections were left with lint failures during the walk) + one concrete next step ("invoke `/pastiche` on a frontend task"). No revision pointer.

Voice: one warm sentence acknowledging the work, no theatrics, no emoji.

### 11. Resume edge cases

**11a. FACT changed between sessions.** Lazy. The skill takes no detection action on FACT drift. Removed atoms surface via subsequent `pastiche lint` runs; new uncovered atoms surface organically via the gating loop's `knowledge-gap` follow-ups. No new config field, no on-resume diff.

**11b. KNOWLEDGE / WISDOM hand-edited between sessions.** File wins. On resume, the skill silently re-derives `setup_progress` from a file scan before resuming. For each KNOWLEDGE section: any non-marker content → `filled`; only the `_(empty — …)_` marker → `stub`. For WISDOM `general-wisdom`: any `[GENERAL]`-tagged bullet present → `filled`; none → `stub`. The re-derivation is silent — no "we detected a change" prompt.

### 12. Frontmatter and skill body title

- `name`: `pastiche-setup`.
- `description`: *"Use when bootstrapping pastiche for first-time adoption (post-`pastiche init`) — fills `KNOWLEDGE.md` and seeds `[GENERAL]` `WISDOM.md` rules section by section. Resumable across sessions; re-invoke to continue."*
- Body H1: `# Pastiche — setup`.

### 13. Error / degraded-state handling

**13a. Empty or missing FACT.** Fail hard with a directive message redirecting to `pastiche sync` or a re-init. Setup cannot honestly mine candidates without vocabulary.

**13b. Sparse FACT (few atoms).** Proceed silently. Thin candidates is honest output for a small DS; setup does not diagnose extractor or `packages:` misconfiguration.

**13c. DESIGN.md becomes unreadable mid-session.** Warn once, drop DESIGN.md context for the remainder of the session, fall back to canonical seeds. Leave `design_md_reference` in config untouched — the consumer clears it manually if they want to.

**13d. Malformed `config.yaml`.** Fail hard with the parser error surfaced. Setup writes back into config (`design_md_reference`, `setup_progress` flips); an unparseable starting state makes those writes unsafe.

## Invariants

- DESIGN.md never sources FACT entries. OSS_SPEC §11.2's "Never" rule stands; the candidate-mining model in locked decision 2 does not override it.
- Canonical seed material is load-bearing in every adoption, not just DESIGN.md-less ones (locked decisions 2, 5c, 7b).
- `setup_progress` is the skill's process marker, but the file is the source of truth — on resume, the file wins and the marker is re-derived (locked decision 11b).
