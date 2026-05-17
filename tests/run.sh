#!/usr/bin/env bash
# tests/run.sh — run every shell test suite in tests/. Fails fast on first failure.
set -u
cd "$(dirname "$0")/.."

fail=0
for t in tests/grep-wisdom.sh tests/grep-pattern-anchors.sh; do
  printf "\n=== %s ===\n" "$t"
  bash "$t" || fail=1
done

if [ "$fail" -ne 0 ]; then
  printf "\n[run.sh] one or more suites failed\n"
  exit 1
fi
printf "\n[run.sh] all suites passed\n"
