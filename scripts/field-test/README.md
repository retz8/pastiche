# Extractor field-test harness (Phase 7 / task 7.1)

Drives `scripts/extract-fact-ts.ts` over real design-system codebases across the
full `config.yaml` scenario space. Findings: `docs/extractor-field-testing.md`.
Spec: `docs/spec/phase-7-extractor-field-testing.md`.

## Layout

- `configs/*.yaml` — the seven scenario configs (committed). Each is a complete
  `pastiche/config.yaml` whose paths are relative to `workspace/`.
- `run.sh` — runner (committed). Copies the chosen scenario config into
  `workspace/pastiche/config.yaml`, runs the extractor with CWD=`workspace`, and
  archives the FACT output to `workspace/out/<scenario>.FACT.md`.
- `workspace/` — ephemeral, gitignored: library installs and generated FACT
  outputs. Not committed.

## Prerequisites (one-time, populate `workspace/`)

```sh
cd scripts/field-test/workspace
npm install @mui/material @mantine/core
git clone --depth 1 https://github.com/shadcn-ui/ui shadcn-src
```

The scenario configs reference:
- `node_modules/@mui/material/index.d.ts`, per-component `.d.ts` subpaths
- `node_modules/@mantine/core/lib/index.d.ts`, `node_modules/@mantine/core/styles.css`
- `shadcn-src/apps/v4/registry/new-york-v4/ui` and `.../charts`
- `shadcn-src/apps/v4/app/globals.css`

shadcn registry paths track upstream `shadcn-ui/ui`; if a future clone moves
them, update the `source_dir`/`tokens` paths in `configs/*.yaml`.

## Run

```sh
./run.sh                       # all seven scenarios
./run.sh s4-mui-mantine-multi-types   # one scenario
```

Exit 0 + a `Wrote pastiche/FACT.md: …` line per scenario = Tier 0 pass.
Spot-check `workspace/out/<scenario>.FACT.md` against each library's public
component list for Tier 1.
