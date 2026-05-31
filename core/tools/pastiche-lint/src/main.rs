fn main() {
    let cwd = std::env::current_dir().expect("cannot determine current directory");
    let report = pastiche_lint::run_lint(&cwd);
    let summary = pastiche_lint::report::format_summary(&report);
    print!("{}", summary);
    if !report.violations.is_empty() {
        let violations_text = pastiche_lint::report::format_violations(&report.violations);
        eprint!("{}", violations_text);
        std::process::exit(1);
    }
}
