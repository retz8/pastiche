use std::fs;
use std::path::Path;

use crate::violation::{Violation, ViolationFamily};

pub struct ReadDocsResult {
    pub config_raw: Option<String>,
    pub fact_raw: Option<String>,
    pub knowledge_raw: Option<String>,
    pub wisdom_raw: Option<String>,
    pub sentinels: Vec<Violation>,
}

fn read_if_exists(cwd: &Path, rel: &str) -> Option<String> {
    let full = cwd.join(rel);
    fs::read_to_string(full).ok()
}

pub fn read_docs(cwd: &Path) -> ReadDocsResult {
    let config_raw = read_if_exists(cwd, "pastiche/config.yaml");
    let fact_raw = read_if_exists(cwd, "pastiche/FACT.md");
    let knowledge_raw = read_if_exists(cwd, "pastiche/KNOWLEDGE.md");
    let wisdom_raw = read_if_exists(cwd, "pastiche/WISDOM.md");

    let mut sentinels = Vec::new();
    let raws: [(&Option<String>, &str); 4] = [
        (&config_raw, "pastiche/config.yaml"),
        (&fact_raw, "pastiche/FACT.md"),
        (&knowledge_raw, "pastiche/KNOWLEDGE.md"),
        (&wisdom_raw, "pastiche/WISDOM.md"),
    ];
    for (raw, rel) in &raws {
        if raw.is_none() {
            sentinels.push(Violation {
                family: ViolationFamily::Sentinel,
                file: rel.to_string(),
                line: 1,
                message: format!("{} not found \u{2014} run /pastiche-init first.", rel),
            });
        }
    }

    ReadDocsResult { config_raw, fact_raw, knowledge_raw, wisdom_raw, sentinels }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn write_file(cwd: &Path, rel: &str, content: &str) {
        let full = cwd.join(rel);
        fs::create_dir_all(full.parent().unwrap()).unwrap();
        fs::write(full, content).unwrap();
    }

    #[test]
    fn returns_sentinels_for_all_four_missing_files() {
        let tmp = TempDir::new().unwrap();
        let r = read_docs(tmp.path());
        assert!(r.config_raw.is_none());
        assert!(r.fact_raw.is_none());
        assert!(r.knowledge_raw.is_none());
        assert!(r.wisdom_raw.is_none());
        assert_eq!(r.sentinels.len(), 4);
        let mut files: Vec<&str> = r.sentinels.iter().map(|v| v.file.as_str()).collect();
        files.sort();
        assert_eq!(files, vec!["pastiche/FACT.md", "pastiche/KNOWLEDGE.md", "pastiche/WISDOM.md", "pastiche/config.yaml"]);
        for v in &r.sentinels {
            assert_eq!(v.family, ViolationFamily::Sentinel);
            assert_eq!(v.line, 1);
            assert!(v.message.contains("not found"));
            assert!(v.message.contains("/pastiche-init"));
        }
    }

    #[test]
    fn loads_contents_and_zero_sentinels_when_all_exist() {
        let tmp = TempDir::new().unwrap();
        write_file(tmp.path(), "pastiche/config.yaml", "platform: claude-code\n");
        write_file(tmp.path(), "pastiche/FACT.md", "## Components\n\n```yaml\n```\n\n## Tokens\n");
        write_file(tmp.path(), "pastiche/KNOWLEDGE.md", "## Action buttons\n");
        write_file(tmp.path(), "pastiche/WISDOM.md", "");
        let r = read_docs(tmp.path());
        assert_eq!(r.config_raw.as_deref(), Some("platform: claude-code\n"));
        assert_eq!(r.sentinels.len(), 0);
    }

    #[test]
    fn sentinel_only_for_missing_file() {
        let tmp = TempDir::new().unwrap();
        write_file(tmp.path(), "pastiche/config.yaml", "platform: claude-code\n");
        write_file(tmp.path(), "pastiche/KNOWLEDGE.md", "");
        write_file(tmp.path(), "pastiche/WISDOM.md", "");
        let r = read_docs(tmp.path());
        assert!(r.fact_raw.is_none());
        assert_eq!(r.sentinels.len(), 1);
        assert_eq!(r.sentinels[0].file, "pastiche/FACT.md");
    }
}
