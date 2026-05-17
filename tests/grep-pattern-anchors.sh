#!/usr/bin/env bash
# tests/grep-pattern-anchors.sh
#
# Asserts that every canonical agent body and skill in pastiche embeds the
# correct grep pattern shapes for FACT atom lookup and WISDOM tag lookup.
# Regression sentinel for task 2.8 (expanded scope, FACT-rooted tags).
#
# Failing this means a sweep missed an anchor — re-read docs/spec/task-2.8-*
# and docs/spec/phase-2-templates-and-skills.md §3, §5 before "fixing" the test.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

# $1 = test name, $2 = file, $3 = literal grep -F pattern that MUST be present
assert_present() {
  local name="$1" file="$2" pat="$3"
  if grep -qF "$pat" "$file"; then
    PASS=$((PASS+1)); printf "PASS  %s\n" "$name"
  else
    FAIL=$((FAIL+1)); printf "FAIL  %s\n      file: %s\n      missing: %s\n" "$name" "$file" "$pat"
  fi
}

# $1 = test name, $2 = file, $3 = literal grep -F pattern that MUST be absent
assert_absent() {
  local name="$1" file="$2" pat="$3"
  if grep -qF "$pat" "$file"; then
    FAIL=$((FAIL+1)); printf "FAIL  %s\n      file: %s\n      forbidden pattern present: %s\n" "$name" "$file" "$pat"
  else
    PASS=$((PASS+1)); printf "PASS  %s\n" "$name"
  fi
}

# ─── FACT anchor: new `^Atom:` shape, not the old `^### [Atom]` shape ─────
assert_present "round-1 uses ^Atom: FACT anchor" \
  agents/pastiche-implementer-round1.md \
  "^(AtomA|AtomB|AtomC):"

assert_present "round-2 uses ^NewAtom: FACT anchor" \
  agents/pastiche-implementer-round2.md \
  "^NewAtom:"

assert_absent  "round-1 has no legacy '### [' FACT anchor" \
  agents/pastiche-implementer-round1.md \
  "### ["

assert_absent  "round-2 has no legacy '### [' FACT anchor" \
  agents/pastiche-implementer-round2.md \
  "### ["

assert_absent  "reviewer has no legacy '### [' FACT anchor" \
  agents/pastiche-reviewer.md \
  "### ["

# ─── WISDOM grep: bracket-delimited form, not legacy `\b…\b` ────────────
assert_present "round-1 uses bracket-delimited WISDOM grep" \
  agents/pastiche-implementer-round1.md \
  '([^]]*,)?(GENERAL|AtomA|AtomB|AtomC)(,[^]]*)?\]'

assert_present "round-2 uses bracket-delimited WISDOM grep" \
  agents/pastiche-implementer-round2.md \
  '([^]]*,)?(GENERAL|NewAtom)(,[^]]*)?\]'

assert_present "reviewer uses bracket-delimited WISDOM grep" \
  agents/pastiche-reviewer.md \
  '([^]]*,)?(GENERAL|AtomA|AtomB|AtomC)(,[^]]*)?\]'

assert_present "pastiche-write-wisdom uses bracket-delimited WISDOM grep" \
  skills/pastiche-write-wisdom.md \
  '([^]]*,)?<Tag>(,[^]]*)?\]'

# Forbid the legacy \b...\b shape in every body that runs the WISDOM grep
for f in agents/pastiche-implementer-round1.md agents/pastiche-implementer-round2.md agents/pastiche-reviewer.md skills/pastiche-write-wisdom.md; do
  assert_absent "no legacy '\\b' WISDOM grep in $f" "$f" '[^]]*\b('
done

# ─── Spec consistency ─────────────────────────────────────────────────────
assert_present "phase-2 spec §5 amended to bracket-delimited form" \
  docs/spec/phase-2-templates-and-skills.md \
  '([^]]*,)?(GENERAL|Atom1|Atom2)(,[^]]*)?\]'

assert_absent  "phase-2 spec §5 no longer uses legacy \\b…\\b form" \
  docs/spec/phase-2-templates-and-skills.md \
  '[^]]*\b(GENERAL|Atom1|Atom2)\b'

# ─── FACT-rooted KNOWLEDGE: kisa example has no derived-utility backticks ─
# Skip HTML-comment lines — the header documents forbidden shapes as negative
# examples ("never `text-foreground`"), which is fine. Scenario content must
# not contain them.
KNOWLEDGE_NONCOMMENT=$(grep -v '<!--' _dev/templates/KNOWLEDGE_umichkisa.example.md || true)

for forbidden in '`text-' '`bg-' '`border-' '`gap-' '`rounded-'; do
  if printf '%s\n' "$KNOWLEDGE_NONCOMMENT" | grep -qF "$forbidden"; then
    FAIL=$((FAIL+1)); printf "FAIL  kisa KNOWLEDGE scenario content contains forbidden %s backticks (Option A)\n" "$forbidden"
  else
    PASS=$((PASS+1)); printf "PASS  kisa KNOWLEDGE scenario content has no %s backticks\n" "$forbidden"
  fi
done

# Dotted type tokens must have the leading dot — bareword `type-…` is forbidden.
if printf '%s\n' "$KNOWLEDGE_NONCOMMENT" | grep -qE '\`type-[a-z0-9-]+\`'; then
  FAIL=$((FAIL+1)); printf "FAIL  kisa KNOWLEDGE has bareword \`type-…\` backticks (must be \`.type-…\`)\n"
else
  PASS=$((PASS+1)); printf "PASS  kisa KNOWLEDGE uses \`.type-…\` form (FACT-verbatim)\n"
fi

# ─── Summary ──────────────────────────────────────────────────────────────
printf "\n%d passed, %d failed\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
