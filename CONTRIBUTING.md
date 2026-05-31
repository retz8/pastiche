# Contributing to pastiche

This guide is for people developing pastiche itself. If you only want to *use* pastiche in your frontend project, you never need any of this — see the [README](./README.md) and install the plugin from the marketplace.

## Prerequisites

| Tool | For |
|---|---|
| **Node ≥ 22** | the build orchestrator, the `extract-fact` extractor, tests |
| **Rust / cargo** | compiling the `pastiche-lint` binary |
| **npm** | the project toolchain (and the source of truth for versioning) |

```
npm install
```

## The one idea: core × adapter → dist

Everything in the repo hangs off a single boundary — **what ships to the adopter** vs. **what only runs on the maintainer's machine**.

```
core/         the product — platform-agnostic source of truth
   │
   ├──────────────►  adapters/<platform>/   the seam — per-platform render rules
   │                        │
   │                        ▼
scripts/build.ts  ──────►  dist/<platform>/  committed, self-contained plugin root
(maintainer only,
 ships nothing)
```

- **`core/`** is the single source of truth. One canonical copy of every skill, agent, template, and tool — no platform names baked in.
- **`adapters/<platform>/`** is the *seam*: the per-platform rules that wrap core content into a platform's required shape.
- **`scripts/build.ts`** is the maintainer-only orchestrator. It reads `core/`, applies an adapter, and writes a complete plugin into `dist/<platform>/`. It ships nothing itself.

The build derives `dist/<platform>/` from one core, so a second platform is *register one adapter*, not a fork.

## Repo layout

```
core/                          the product (ships to the adopter)
  agents/                      canonical body + per-platform sidecars (adapted)
    pastiche-reviewer.md                          ← canonical body (platform-agnostic)
    pastiche-reviewer.claude-code.meta.yaml       ← Claude Code sidecar (frontmatter, model pin)
    pastiche-reviewer.codex.meta.yaml             ← Codex sidecar
  skills/                      canonical SKILL bodies (NOT adapted — copied as-is)
  templates/                   the three docs (FACT/KNOWLEDGE/WISDOM) + config.yaml
  tools/                       shipped runtime executables (same binary on every platform)
    extract-fact/              TS extractor — bundled to bin/extract-fact
    pastiche-lint/             Rust cargo project — compiled to bin/pastiche-lint

adapters/                      the seam (maintainer-only; never shipped)
  claude-code/agents.template  render rules: {{sidecar}} + {{body}} → final agent file
  codex/agents.template

scripts/build.ts               build orchestrator + adapter registry (ships nothing)

dist/                          committed build output — one self-contained plugin root per platform
  claude-code/                 .claude-plugin/plugin.json + skills/ + agents/ + bin/ + templates/

.claude-plugin/marketplace.json   hand-authored Claude Code distribution catalog (repo root by convention)

docs/        examples/         adopter-facing docs and the reference adoption
```

`core/tools/` lives under `core/` because those binaries are **shipped** — skills invoke them off the plugin's `bin/` PATH on the *adopter's* machine. `scripts/build.ts` runs only on *your* machine, so it stays out of `core/`. They sit on opposite sides of the ships-to-adopter line.

## The per-concept abstraction line

Pastiche decides how much to abstract **per concept**, based on whether platforms genuinely diverge:

| Concept | Platforms… | So it's… | Build step |
|---|---|---|---|
| **skills** | converge (a plain `SKILL.md` works everywhere) | one canonical body, **no adapter** | copied `core/skills/x.md` → `dist/.../skills/x/SKILL.md` |
| **agents** | diverge (Claude YAML frontmatter vs. Codex TOML `developer_instructions`, per-role model pins) | canonical body **+ per-platform sidecar**, joined through an adapter template | `body` + `sidecar` → `adapters/<p>/agents.template` → rendered agent |
| **templates / tools** | identical everywhere | pastiche-specific / one binary | copied / compiled as-is |

This is the invariant to preserve: **don't add an adapter where platforms converge, and don't inline-dispatch where they diverge.** Per-role model pinning (Opus for round 1, Sonnet for round 2 + reviewer) lives declaratively in the agent sidecars — it's a feature of the seam, not hardcoded in the build.

## How the build works

```
npm run build                      # all registered platforms (v1: claude-code)
npm run build -- --platform=claude-code
```

For each platform the orchestrator (`scripts/build.ts`) runs:

1. **clean** `dist/<platform>/`
2. **render agents** — for each `core/agents/*.md`, join its `.<platform>.meta.yaml` sidecar and body through `adapters/<platform>/agents.template`
3. **copy skills** — `core/skills/x.md` → `skills/x/SKILL.md`
4. **copy templates** — the three docs + `config.yaml`
5. **generate `plugin.json`** — derived from `package.json` (never hand-edited)
6. **bundle `extract-fact`** (tsup) + write its `bin/` wrapper
7. **compile `pastiche-lint`** (`cargo build --release`) → `bin/`

Result: `dist/<platform>/` is a complete, self-contained plugin root.

### Adding a platform

Register one `PlatformAdapter` in `scripts/build.ts`'s `ADAPTERS` map and add `adapters/<platform>/`. The core loop doesn't change. (Codex sidecars already exist under `core/agents/`; the Codex adapter is the placeholder that finishes the wiring.)

## Dev scripts

| Command | What it does |
|---|---|
| `npm run build` | build the plugin into `dist/` (see above) |
| `npm test` | extractor unit tests (`node --test`, tsx) |
| `npm run test:lint` | `pastiche-lint` Rust tests (`cargo test`) |
| `npm run extract:fact` | run the extractor directly against a target codebase |
| `tests/run.sh` | grep-pattern / wisdom anchor checks |

## Versioning & distribution

- **Lockstep, single version.** `package.json`'s `version` is the one source of truth; it fans out to every build artifact. The build stamps `plugin.json` from it — **generated files are never hand-edited or version-bumped.** Only authored files (`package.json`, root `marketplace.json`) carry a version to bump.
- **`dist/` is committed.** A Claude Code marketplace resolves a relative `source` only over git, so the built artifact must be tracked. Rebuild and commit `dist/` whenever you change anything under `core/` or `adapters/`.

## Before you open a PR

- [ ] `npm run build` succeeds and you committed the regenerated `dist/`
- [ ] `npm test` and `npm run test:lint` pass
- [ ] No platform names leaked into `core/` bodies (project-agnostic invariant)
- [ ] You changed **form**, not the **content**, of canonical bodies unless the change is the point

## License

By contributing you agree your contributions are licensed under the [MIT License](./LICENSE).
