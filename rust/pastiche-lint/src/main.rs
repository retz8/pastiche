mod canonical_sections;
mod config;
mod fact;
mod knowledge;
mod read_docs;
mod report;
mod violation;
mod wisdom;

use report::{format_summary, format_violations, LintCounts, LintReport};
use violation::ViolationFamily;

fn run_lint(cwd: &std::path::Path) -> LintReport {
    let mut violations = Vec::new();
    let mut skipped: Vec<String> = Vec::new();
    let mut counts = LintCounts::default();

    let docs = read_docs::read_docs(cwd);
    violations.extend(docs.sentinels);

    if let Some(ref config_raw) = docs.config_raw {
        let c = config::validate_config(config_raw);
        violations.extend(c);
    }

    let mut atoms: Option<fact::FactAtoms> = None;
    let mut fact_ok = false;

    if let Some(ref fact_raw) = docs.fact_raw {
        let f = fact::parse_and_validate_fact(fact_raw);
        let no_schema_errors = f.violations.is_empty();
        let has_atoms = !f.atoms.components.is_empty() || !f.atoms.tokens.is_empty();
        counts.fact_components = f.atoms.components.len();
        counts.fact_tokens = f.atoms.tokens.len();
        violations.extend(f.violations);

        if no_schema_errors && !has_atoms {
            violations.push(violation::Violation {
                family: ViolationFamily::Sentinel,
                file: "pastiche/FACT.md".to_string(),
                line: 1,
                message: "FACT.md has no atoms \u{2014} run /pastiche-sync to extract.".to_string(),
            });
        }
        fact_ok = no_schema_errors && has_atoms;
        atoms = Some(f.atoms);
    }

    if let Some(ref wisdom_raw) = docs.wisdom_raw {
        if fact_ok {
            let w = wisdom::lint_wisdom(wisdom_raw, atoms.as_ref().unwrap());
            counts.wisdom_tags_checked = w.counts.tags_checked;
            counts.wisdom_general_tags = w.counts.general_tags;
            counts.wisdom_fact_bound_tags = w.counts.fact_bound_tags;
            violations.extend(w.violations);
        } else {
            skipped.push("wisdom".to_string());
        }
    }

    if let Some(ref knowledge_raw) = docs.knowledge_raw {
        if fact_ok {
            let k = knowledge::lint_knowledge_refs(knowledge_raw, atoms.as_ref().unwrap());
            counts.knowledge_code_spans_checked = k.counts.code_spans_checked;
            counts.knowledge_component_refs = k.counts.component_refs;
            counts.knowledge_token_refs = k.counts.token_refs;
            counts.knowledge_ignored = k.counts.ignored;
            violations.extend(k.violations);
        } else {
            skipped.push("knowledge-refs".to_string());
        }
        let s = knowledge::lint_knowledge_sections(knowledge_raw);
        counts.canonical_sections_found = s.found;
        violations.extend(s.violations);
    }

    LintReport {
        violations,
        counts,
        skipped,
    }
}

fn main() {
    let cwd = std::env::current_dir().expect("cannot determine current directory");
    let report = run_lint(&cwd);
    let summary = format_summary(&report);
    eprint!("{}", "");
    print!("{}", summary);
    if !report.violations.is_empty() {
        let violations_text = format_violations(&report.violations);
        eprint!("{}", violations_text);
        std::process::exit(1);
    }
}
