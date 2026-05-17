#!/usr/bin/env bash
# tests/grep-wisdom.sh
#
# Verifies the bracket-delimited WISDOM-tag grep pattern used by every pastiche
# agent body (round-1 step 5, round-2 NewAtom carve-out, reviewer step 4) and
# by pastiche-write-wisdom (neighbor scan + insert).
#
# Pattern under test (substitute the target tag(s) where TAG appears):
#   ^- \[([^]]*,)?(TAG)(,[^]]*)?\]
#
# Each case checks: pattern matches the expected line numbers in
# tests/fixtures/wisdom-grep.md, no more and no less.
#
# Exit 0 on full pass, 1 on any failure. Run from repo root: bash tests/grep-wisdom.sh

set -u
FIXTURE="$(dirname "$0")/fixtures/wisdom-grep.md"
[ -f "$FIXTURE" ] || { echo "FAIL: fixture not found: $FIXTURE"; exit 1; }

PASS=0
FAIL=0

# Run a grep against the fixture and assert the matched line numbers equal the
# expected list. $1 = test name, $2 = grep -E pattern, $3 = expected line nums
# (space-separated, sorted), or "-" for "no matches expected".
assert_match() {
  local name="$1" pattern="$2" expected="$3"
  local actual
  actual=$(grep -nE "$pattern" "$FIXTURE" | cut -d: -f1 | tr '\n' ' ' | sed 's/ $//')
  [ -z "$actual" ] && actual="-"
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS+1))
    printf "PASS  %s\n" "$name"
  else
    FAIL=$((FAIL+1))
    printf "FAIL  %s\n      pattern:  %s\n      expected: %s\n      actual:   %s\n" \
      "$name" "$pattern" "$expected" "$actual"
  fi
}

# Fixture line map (bullets start at line 9):
#    9 [GENERAL]
#   10 [Button]                                11 [Button,Avatar]
#   12 [Card,Button]                           13 [Card,Button,Avatar]
#   14 [ButtonGroup]                           15 [ButtonGroup,Card]
#   16 [Card,ButtonGroup]
#   17 [--color-brand-primary]                 18 [--color-foreground,Button]
#   19 [Card,--color-surface]                  20 [Card,--color-surface,Button]
#   21 [.type-h1]                              22 [.type-h1,Button]
#   23 [Card,.type-display]
#   24 [Form.Input]                            25 [Form.Input,Card]
#   26 [Card,Form.Input,Button]
#   27 [GENERAL,Button,--color-error,.type-caption,Form.Select]

# ─── Case 1: bare component, with substring-trap negative ──────────────────
assert_match "Button bare; rejects ButtonGroup substring trap" \
  '^- \[([^]]*,)?(Button)(,[^]]*)?\]' \
  "10 11 12 13 18 20 22 26 27"

# ─── Case 2: GENERAL ─────────────────────────────────────────────────────
assert_match "GENERAL tag" \
  '^- \[([^]]*,)?(GENERAL)(,[^]]*)?\]' \
  "9 27"

# ─── Case 3: CSS-var token (--prefix) — the case `\b` was breaking ────────
assert_match "CSS-var --color-foreground (was 0 with \\b)" \
  '^- \[([^]]*,)?(--color-foreground)(,[^]]*)?\]' \
  "18"

assert_match "CSS-var --color-surface" \
  '^- \[([^]]*,)?(--color-surface)(,[^]]*)?\]' \
  "19 20"

assert_match "CSS-var --color-brand-primary alone" \
  '^- \[([^]]*,)?(--color-brand-primary)(,[^]]*)?\]' \
  "17"

# ─── Case 4: dotted-class token (.prefix) ─────────────────────────────────
assert_match "dotted .type-h1 (escaped dot)" \
  '^- \[([^]]*,)?(\.type-h1)(,[^]]*)?\]' \
  "21 22"

assert_match "dotted .type-display" \
  '^- \[([^]]*,)?(\.type-display)(,[^]]*)?\]' \
  "23"

# ─── Case 5: namespaced component (dot inside name) ──────────────────────
assert_match "namespaced Form.Input (escaped dot)" \
  '^- \[([^]]*,)?(Form\.Input)(,[^]]*)?\]' \
  "24 25 26"

assert_match "namespaced Form.Select on mixed-shapes line" \
  '^- \[([^]]*,)?(Form\.Select)(,[^]]*)?\]' \
  "27"

# ─── Case 6: alternation — round-1's actual use ──────────────────────────
# Round-1 greps once for GENERAL plus all candidate atoms.
assert_match "alternation: GENERAL|Button|--color-surface" \
  '^- \[([^]]*,)?(GENERAL|Button|--color-surface)(,[^]]*)?\]' \
  "9 10 11 12 13 18 19 20 22 26 27"

# ─── Case 7: substring negative regression — Button must not match ButtonGroup ──
# Searching Button across the fixture, lines 14/15/16 (ButtonGroup) must NOT match.
trap_hits=$(grep -nE '^- \[([^]]*,)?(Button)(,[^]]*)?\]' "$FIXTURE" | cut -d: -f1 | grep -E '^(14|15|16)$' || true)
if [ -z "$trap_hits" ]; then
  PASS=$((PASS+1)); printf "PASS  substring trap rejection (Button vs ButtonGroup)\n"
else
  FAIL=$((FAIL+1)); printf "FAIL  substring trap: Button incorrectly matched line(s): %s\n" "$trap_hits"
fi

# ─── Case 8: legacy \b pattern regression — must fail on --prefix ─────────
# Demonstrates why we replaced \b…\b. If this assertion ever flips, someone
# reverted the fix.
legacy_hits=$(grep -nE '^- \[[^]]*\b(--color-brand-primary)\b' "$FIXTURE" | wc -l | tr -d ' ')
if [ "$legacy_hits" = "0" ]; then
  PASS=$((PASS+1)); printf "PASS  legacy \\\\b pattern still broken on --prefix (regression sentinel)\n"
else
  FAIL=$((FAIL+1)); printf "FAIL  legacy \\\\b pattern unexpectedly matched %s line(s) — fixture or regex changed\n" "$legacy_hits"
fi

# ─── Summary ──────────────────────────────────────────────────────────────
printf "\n%d passed, %d failed\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
