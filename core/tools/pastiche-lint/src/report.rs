use crate::violation::Violation;

pub struct LintCounts {
    pub fact_components: usize,
    pub fact_tokens: usize,
    pub wisdom_tags_checked: usize,
    pub wisdom_general_tags: usize,
    pub wisdom_fact_bound_tags: usize,
    pub knowledge_code_spans_checked: usize,
    pub knowledge_component_refs: usize,
    pub knowledge_token_refs: usize,
    pub knowledge_ignored: usize,
    pub canonical_sections_found: usize,
}

impl Default for LintCounts {
    fn default() -> Self {
        Self {
            fact_components: 0,
            fact_tokens: 0,
            wisdom_tags_checked: 0,
            wisdom_general_tags: 0,
            wisdom_fact_bound_tags: 0,
            knowledge_code_spans_checked: 0,
            knowledge_component_refs: 0,
            knowledge_token_refs: 0,
            knowledge_ignored: 0,
            canonical_sections_found: 0,
        }
    }
}

pub struct LintReport {
    pub violations: Vec<Violation>,
    pub counts: LintCounts,
    pub skipped: Vec<String>,
}

pub fn format_summary(report: &LintReport) -> String {
    let c = &report.counts;
    let v = &report.violations;
    let wisdom_skipped = report.skipped.contains(&"wisdom".to_string());
    let knowledge_refs_skipped = report.skipped.contains(&"knowledge-refs".to_string());

    let sentinel_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Sentinel).count();
    let config_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Config).count();
    let fact_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Fact).count();
    let wisdom_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Wisdom).count();
    let _knowledge_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Knowledge).count();

    let mut lines = Vec::new();
    lines.push("pastiche:lint \u{2014} cross-doc tag-sanity + schema".to_string());
    lines.push(String::new());
    lines.push(format!(
        "  FACT.md         {} components, {} tokens (source of truth)",
        c.fact_components, c.fact_tokens
    ));
    lines.push(format!(
        "  config.yaml     {} sentinel(s), {} schema violation(s)",
        sentinel_count, config_count
    ));
    lines.push(format!("  FACT.md         {} schema violation(s)", fact_count));

    if wisdom_skipped {
        lines.push("  WISDOM.md       SKIPPED (FACT schema failed or empty atom set)".to_string());
    } else {
        lines.push(format!(
            "  WISDOM.md       {} tag(s) checked \u{2192} {} FACT-bound, {} [GENERAL]; {} violation(s)",
            c.wisdom_tags_checked, c.wisdom_fact_bound_tags, c.wisdom_general_tags, wisdom_count
        ));
    }

    if knowledge_refs_skipped {
        lines.push("  KNOWLEDGE.md    SKIPPED refs (FACT schema failed or empty atom set)".to_string());
    } else {
        lines.push(format!(
            "  KNOWLEDGE.md    {} code-span(s) scanned \u{2192} {} component ref(s), {} token ref(s), {} ignored (Tailwind/prop/prose)",
            c.knowledge_code_spans_checked, c.knowledge_component_refs, c.knowledge_token_refs, c.knowledge_ignored
        ));
    }

    let knowledge_count = v.iter().filter(|x| x.family == crate::violation::ViolationFamily::Knowledge).count();
    lines.push(format!(
        "  KNOWLEDGE.md    {}/12 canonical section(s) present; {} violation(s)",
        c.canonical_sections_found, knowledge_count
    ));
    lines.push(String::new());

    if v.is_empty() {
        lines.push("pastiche:lint OK \u{2014} 0 violations.".to_string());
    } else {
        lines.push(format!("pastiche:lint FAILED \u{2014} {} violation(s).", v.len()));
    }

    lines.join("\n") + "\n"
}

pub fn format_violations(violations: &[Violation]) -> String {
    if violations.is_empty() {
        return String::new();
    }
    let mut lines = vec!["Violations:".to_string()];
    for v in violations {
        lines.push(format!("  {}:{} {}", v.file, v.line, v.message));
    }
    lines.join("\n") + "\n"
}
