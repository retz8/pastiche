use std::collections::HashSet;

use regex::Regex;

use crate::canonical_sections::CANONICAL_SECTIONS;
use crate::fact::FactAtoms;
use crate::violation::{Violation, ViolationFamily};

const KNOWLEDGE: &str = "pastiche/KNOWLEDGE.md";

fn v(line: usize, message: String) -> Violation {
    Violation {
        family: ViolationFamily::Knowledge,
        file: KNOWLEDGE.to_string(),
        line,
        message,
    }
}

// --- Refs lint ---

pub struct LintKnowledgeRefsCounts {
    pub code_spans_checked: usize,
    pub component_refs: usize,
    pub token_refs: usize,
    pub ignored: usize,
}

pub struct LintKnowledgeRefsResult {
    pub violations: Vec<Violation>,
    pub counts: LintKnowledgeRefsCounts,
}

pub fn lint_knowledge_refs(text: &str, atoms: &FactAtoms) -> LintKnowledgeRefsResult {
    let mut violations = Vec::new();
    let mut code_spans_checked: usize = 0;
    let mut component_refs: usize = 0;
    let mut token_refs: usize = 0;
    let mut ignored: usize = 0;

    let code_span_re = Regex::new(r"`([^`]+)`").unwrap();
    let pascal_head_re = Regex::new(r"^([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)\b").unwrap();

    for (i, line) in text.split('\n').enumerate() {
        if line.trim_start().starts_with("<!--") {
            continue;
        }
        for caps in code_span_re.captures_iter(line) {
            let span = caps[1].trim();
            code_spans_checked += 1;

            if let Some(head_caps) = pascal_head_re.captures(span) {
                let name = &head_caps[1];
                if atoms.components.contains(name) {
                    component_refs += 1;
                } else {
                    violations.push(v(
                        i + 1,
                        format!(
                            "unknown component `{}` (in `{}`) \u{2014} not in FACT.md.",
                            name, span
                        ),
                    ));
                }
                continue;
            }
            if atoms.tokens.contains(span) {
                token_refs += 1;
                continue;
            }
            ignored += 1;
        }
    }

    LintKnowledgeRefsResult {
        violations,
        counts: LintKnowledgeRefsCounts {
            code_spans_checked,
            component_refs,
            token_refs,
            ignored,
        },
    }
}

// --- Canonical sections check ---

pub struct LintKnowledgeSectionsResult {
    pub violations: Vec<Violation>,
    pub found: usize,
}

pub fn lint_knowledge_sections(text: &str) -> LintKnowledgeSectionsResult {
    let mut violations = Vec::new();
    let h2_re = Regex::new(r"^## (.+?)\s*$").unwrap();

    let present: HashSet<String> = text
        .split('\n')
        .filter_map(|line| h2_re.captures(line).map(|c| c[1].trim().to_string()))
        .collect();

    let mut found: usize = 0;
    for section in CANONICAL_SECTIONS {
        if present.contains(section.name) {
            found += 1;
        } else {
            violations.push(v(
                1,
                format!(
                    "missing canonical section: \"## {}\" (may be an empty stub).",
                    section.name
                ),
            ));
        }
    }

    LintKnowledgeSectionsResult { violations, found }
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

    fn knowledge_with_all_sections() -> String {
        CANONICAL_SECTIONS
            .iter()
            .map(|s| format!("## {}\n\n_(empty)_\n", s.name))
            .collect::<Vec<_>>()
            .join("\n")
    }

    // --- Refs ---

    #[test]
    fn known_components_and_tokens_pass() {
        let a = atoms(&["Button", "IconButton", "Form.Input"], &["--color-brand-primary", ".type-display"]);
        let k = "\n### Primary action\n\u{2192} `Button variant=\"primary\"`\n\n### Icon-only action\n\u{2192} `IconButton` with `aria-label`\n\n### Single-line text input\n\u{2192} `Form.Input`\n\n### Brand color\n\u{2192} `--color-brand-primary` pairs with foreground.\n";
        let r = lint_knowledge_refs(k, &a);
        assert!(r.violations.is_empty(), "got: {:?}", r.violations);
    }

    #[test]
    fn unknown_component_fails() {
        let a = atoms(&["Button"], &[]);
        let k = "\u{2192} `Modal variant=\"alert\"`";
        let r = lint_knowledge_refs(k, &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("unknown component") && r.violations[0].message.contains("Modal"));
    }

    #[test]
    fn pascal_head_with_trailing_props() {
        let a = atoms(&["Button"], &[]);
        let k = "\u{2192} `Button variant=\"primary\" disabled`";
        let r = lint_knowledge_refs(k, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn form_namespace_resolves() {
        let a = atoms(&["Form.Input"], &[]);
        let k = "\u{2192} `Form.Input` and also `Form.Missing`";
        let r = lint_knowledge_refs(k, &a);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("Form.Missing"));
    }

    #[test]
    fn tailwind_and_props_ignored() {
        let a = atoms(&["Button"], &["--color-foreground"]);
        let k = "\nUse `gap-2`, `rounded-md`, `flex items-center`, `hover:underline` and\n`aria-label`, `type=\"submit\"` \u{2014} none are atoms.\n";
        let r = lint_knowledge_refs(k, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn non_pascal_token_not_in_fact_ignored() {
        let a = atoms(&[], &["--color-brand-primary"]);
        let k = "Use `--color-brand-typo` here.";
        let r = lint_knowledge_refs(k, &a);
        assert!(r.violations.is_empty());
        assert_eq!(r.counts.ignored, 1);
    }

    #[test]
    fn html_comments_skipped() {
        let a = atoms(&["Button"], &[]);
        let k = "<!-- example uses `Modal` -->\n\u{2192} `Button`";
        let r = lint_knowledge_refs(k, &a);
        assert!(r.violations.is_empty());
    }

    #[test]
    fn counts_component_token_ignored() {
        let a = atoms(&["Button"], &["--color-foreground"]);
        let k = "\n\u{2192} `Button variant=\"primary\"`, also `gap-2`, `--color-foreground`, `flex items-center`.\n";
        let r = lint_knowledge_refs(k, &a);
        assert_eq!(r.counts.code_spans_checked, 4);
        assert_eq!(r.counts.component_refs, 1);
        assert_eq!(r.counts.token_refs, 1);
        assert_eq!(r.counts.ignored, 2);
    }

    #[test]
    fn violation_line_numbers() {
        let a = atoms(&["Button"], &[]);
        let k = "\n\n\u{2192} `Modal`\n";
        let r = lint_knowledge_refs(k, &a);
        assert_eq!(r.violations[0].line, 3);
    }

    // --- Canonical sections ---

    #[test]
    fn all_12_sections_present_no_violations() {
        let r = lint_knowledge_sections(&knowledge_with_all_sections());
        assert!(r.violations.is_empty());
        assert_eq!(r.found, 12);
    }

    #[test]
    fn missing_one_section_one_violation() {
        let text = knowledge_with_all_sections().replace("## Brand Identity\n\n_(empty)_\n", "");
        let r = lint_knowledge_sections(&text);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("Brand Identity"));
        assert_eq!(r.found, 11);
    }

    #[test]
    fn extra_non_canonical_h2_allowed() {
        let text = knowledge_with_all_sections() + "\n## Extra Section\n\n_(custom)_\n";
        let r = lint_knowledge_sections(&text);
        assert!(r.violations.is_empty());
        assert_eq!(r.found, 12);
    }

    #[test]
    fn section_names_case_sensitive() {
        let text = knowledge_with_all_sections().replace("## Brand Identity", "## brand identity");
        let r = lint_knowledge_sections(&text);
        assert_eq!(r.violations.len(), 1);
        assert!(r.violations[0].message.contains("Brand Identity"));
    }
}
