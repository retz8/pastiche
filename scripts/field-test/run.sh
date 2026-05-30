#!/usr/bin/env bash
# Field-test runner for the pastiche FACT extractor (Phase 7 / task 7.1).
#
# Drives the extractor over the scenario configs in ./configs against real
# library installs under ./workspace. The extractor reads CWD/pastiche/config.yaml,
# so each run copies the chosen scenario config into workspace/pastiche/config.yaml
# and invokes the extractor with CWD=workspace. The generated FACT.md is archived
# to workspace/out/<scenario>.FACT.md for spot-checking.
#
# Usage:
#   ./run.sh                 run all scenarios
#   ./run.sh s1-mui-zero-tokens   run one scenario by config basename
#
# Prerequisites (ephemeral, gitignored — see README.md):
#   workspace/node_modules/@mui/material, @mantine/core   (npm install)
#   workspace/shadcn-src/                                   (git clone shadcn-ui/ui)
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WS="$HERE/workspace"
EXTRACTOR="$HERE/../extract-fact-ts.ts"
mkdir -p "$WS/pastiche" "$WS/out"

run_one() {
  local name="$1"
  local cfg="$HERE/configs/$name.yaml"
  if [ ! -f "$cfg" ]; then echo "no such config: $name" >&2; return 2; fi
  cp "$cfg" "$WS/pastiche/config.yaml"
  echo "=============================================================="
  echo "SCENARIO: $name"
  echo "=============================================================="
  ( cd "$WS" && node --import tsx "$EXTRACTOR" )
  local rc=$?
  if [ "$rc" -eq 0 ] && [ -f "$WS/pastiche/FACT.md" ]; then
    cp "$WS/pastiche/FACT.md" "$WS/out/$name.FACT.md"
  fi
  echo "exit: $rc"
  return "$rc"
}

if [ "$#" -ge 1 ]; then
  run_one "$1"
else
  rc=0
  for c in "$HERE"/configs/*.yaml; do
    run_one "$(basename "$c" .yaml)" || rc=1
  done
  exit "$rc"
fi
