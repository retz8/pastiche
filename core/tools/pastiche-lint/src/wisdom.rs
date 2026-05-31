use std::collections::HashSet;

use regex::Regex;

use crate::fact::FactAtoms;
use crate::violation::{Violation, ViolationFamily};

const WISDOM: &str = "pastiche/WISDOM.md";

pub struct LintWisdomCounts {
    pub tags_checked: usize,
    pub general_tags: usize,
    pub fact_bound_tags: usize,
}

pub struct LintWisdomResult {
    pub violations: Vec<Violation>,
    pub counts: LintWisdomCounts,
}

fn v(line: usize, message: String) -> Violation {
    Violation {
        family: ViolationFamily::Wisdom,
        file: WISDOM.to_string(),
        line,
        message,
    }
}

pub fn lint_wisdom(text: &str, atoms: &FactAtoms) -> LintWisdomResult {
    let mut violations = Vec::new();
    let valid_atoms: HashSet<&str> = atoms
        .components
        .iter()
        .chain(atoms.tokens.iter())
        .map(|s| s.as_str())
        .collect();

    let mut tags_checked: usize = 0;
    let mut general_tags: usize = 0;
    let mut fact_bound_tags: usize = 0;

    let tag_char_re = Regex::new(r"^[A-Za-z0-9_.\-]+$").unwrap();
    let leading_bullet_re = Regex::new(r"^- \[([^\]]*)\]").unwrap();
    let code_span_re = Regex::new(r"`[^`]*`").unwrap();
    let allow_listed = HashSet::from(["GENERAL"]);

    for (i, raw) in text.split('\n').enumerate() {
        if raw.trim_start().starts_with("<!--") {
            continue;
        }

        let stripped = code_span_re.replace_all(raw, "");

        let m = match leading_bullet_re.captures(&stripped) {
            Some(caps) => caps,
            None => continue,
        };
        let inner = &m[1];

        // Legacy concatenated [A][B] check.
        if let Some(close_idx) = stripped.find(']') {
            if stripped.as_bytes().get(close_idx + 1) == Some(&b'[') {
                violations.push(v(
                    i + 1,
                    "legacy concatenated bracket form \"[A][B]\" is not allowed \u{2014} use \"[A,B]\".".to_string(),
                ));
                continue;
            }
        }

        // Malformed bracket group.
        let is_malformed = inner.is_empty()
            || inner.contains(char::is_whitespace)
            || inner.starts_with(',')
            || inner.ends_with(',')
            || inner.contains(",,");
        if is_malformed {
            violations.push(v(
                i + 1,
                format!(
                    "malformed tag group \"[{}]\" \u{2014} use strict [Tag1,Tag2,...] with no whitespace.",
                    inner
                ),
            ));
            continue;
        }

        // Split and validate tags.
        let tags: Vec<&str> = inner.split(',').collect();
        let mut line_had_invalid_shape = false;
        for tag in &tags {
            if !tag_char_re.is_match(tag) {
                violations.push(v(
                    i + 1,
                    format!(
                        "malformed tag group \"[{}]\" \u{2014} tag \"{}\" has invalid characters.",
                        inner, tag
                    ),
                ));
                line_had_invalid_shape = true;
                break;
            }
        }
        if line_had_invalid_shape {
            continue;
        }

        for tag in &tags {
            tags_checked += 1;
            if allow_listed.contains(tag) {
                general_tags += 1;
                continue;
            }
            if !valid_atoms.contains(tag) {
                violations.push(v(
                    i + 1,
                    format!("unknown tag [{}] \u{2014} not in FACT.md.", tag),
                ));
                continue;
            }
            fact_bound_tags += 1;
        }
    }

    LintWisdomResult {
        violations,
        counts: LintWisdomCounts {
            tags_checked,
            general_tags,
            fact_bound_tags,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn atoms(components: &[&str], tokens: &[&str]) -> FactAtoms {
        FactAtoms {
            components: components.iter().map(|s| s.to_string()).collect(),
            tokens: tokens.iter().map(|s| s.to_string()).collect(),
        }
    }

    #[test]
    fn valid_strict_format_tags_pass() {
        let a = atoms(&["Button", "IconButton", "Form.Input"], &["--color-brand-primary", ".type-display"]);
        let w = "- [Button] Default type is \"button\".\n- [Button,IconButton] Dual-ring focus.\n- [GENERAL] No dark mode.\n- [--color-brand-primary] Pairs with foreground.\n- [.type-display,Button] Use tracking-tight.\n";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty(), "got: {:?}", r.violations);
        assert_eq!(r.counts.tags_checked, 7);
        assert_eq!(r.counts.general_tags, 1);
    }

    #[test]
    fn unknown_tag_fails() {
        let a = atoms(&["Button"], &[]);
        let w = "\n- [Button] ok.\n- [Modal] stale tag.\n";
        let r = lint_wisdom(w, &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("unknown tag") && r.violations[0].message.contains("Modal"));
        assert_eq!(r.violations[0].line, 3);
    }

    #[test]
    fn whitespace_inside_bracket_malformed() {
        let a = atoms(&["Button", "IconButton"], &[]);
        let w = "- [Button, IconButton] should fail strict format.";
        let r = lint_wisdom(w, &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn legacy_concatenated_rejected() {
        let a = atoms(&["Button", "IconButton"], &[]);
        let w = "- [Button][IconButton] legacy form.";
        let r = lint_wisdom(w, &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("legacy concatenated"));
    }

    #[test]
    fn empty_brackets_malformed() {
        let a = atoms(&["Button"], &[]);
        let r = lint_wisdom("- [] rule.", &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn leading_comma_malformed() {
        let a = atoms(&["Button"], &[]);
        let r = lint_wisdom("- [,Button] rule.", &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn trailing_comma_malformed() {
        let a = atoms(&["Button"], &[]);
        let r = lint_wisdom("- [Button,] rule.", &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn double_comma_malformed() {
        let a = atoms(&["Button", "IconButton"], &[]);
        let r = lint_wisdom("- [Button,,IconButton] rule.", &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn whitespace_only_malformed() {
        let a = atoms(&[], &[]);
        let r = lint_wisdom("- [ ] rule.", &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("malformed tag group"));
    }

    #[test]
    fn code_spans_not_tags() {
        let a = atoms(&["Button"], &[]);
        let w = "- [Button] never use `px-[24px]` or `mt-[13px]`.";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn subsequent_bracket_not_tag() {
        let a = atoms(&["Button"], &[]);
        let w = "- [Button] later prose mentions [Modal] but Modal is not a tag here.";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn html_comments_skipped() {
        let a = atoms(&["Button"], &[]);
        let w = "<!-- example: [Foo,Bar] -->\n- [Button] ok.";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn non_bullet_lines_skipped() {
        let a = atoms(&["Button"], &[]);
        let w = "\nsome intro prose with [Modal] in it.\n- [Button] rule.\n  continuation line with [Modal].\n";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn general_counts_separately() {
        let a = atoms(&["Button"], &[]);
        let w = "\n- [Button] rule one.\n- [GENERAL] rule two.\n- [Button,GENERAL] paired.\n";
        let r = lint_wisdom(w, &a);
        assert!(r.violations.is_empty());
        assert_eq!(r.counts.tags_checked, 4);
        assert_eq!(r.counts.general_tags, 2);
        assert_eq!(r.counts.fact_bound_tags, 2);
    }
}
