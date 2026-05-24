use std::collections::HashSet;

use regex::Regex;

use crate::violation::{Violation, ViolationFamily};

const FACT: &str = "pastiche/FACT.md";

pub struct FactAtoms {
    pub components: HashSet<String>,
    pub tokens: HashSet<String>,
}

pub struct ParseFactResult {
    pub atoms: FactAtoms,
    pub violations: Vec<Violation>,
}

fn v(line: usize, message: String) -> Violation {
    Violation {
        family: ViolationFamily::Fact,
        file: FACT.to_string(),
        line,
        message,
    }
}

pub fn parse_and_validate_fact(text: &str) -> ParseFactResult {
    let mut violations = Vec::new();
    let mut components = HashSet::new();
    let mut tokens = HashSet::new();
    let lines: Vec<&str> = text.split('\n').collect();

    let h2_re = Regex::new(r"^## (.+?)\s*$").unwrap();
    let atom_name_re = Regex::new(r"^([A-Za-z][\w.]*):\s*").unwrap();
    let fence_open_re = Regex::new(r"^```yaml\s*$").unwrap();
    let fence_close_re = Regex::new(r"^```\s*$").unwrap();

    // Scan H2 positions.
    struct H2Pos {
        name: String,
        line: usize,
    }
    let mut h2_positions: Vec<H2Pos> = Vec::new();
    let mut components_h2: Option<usize> = None;
    let mut tokens_h2: Option<usize> = None;

    for (i, line) in lines.iter().enumerate() {
        if let Some(caps) = h2_re.captures(line) {
            let name = caps[1].trim().to_string();
            if name == "Components" && components_h2.is_none() {
                components_h2 = Some(i);
            }
            if name == "Tokens" && tokens_h2.is_none() {
                tokens_h2 = Some(i);
            }
            h2_positions.push(H2Pos { name, line: i });
        }
    }

    if components_h2.is_none() {
        violations.push(v(1, "missing \"## Components\" H2 header.".to_string()));
    }
    if tokens_h2.is_none() {
        violations.push(v(1, "missing \"## Tokens\" H2 header.".to_string()));
    }

    // Parse components fence.
    if let Some(comp_h2) = components_h2 {
        let search_end = h2_positions
            .iter()
            .find(|h| h.line > comp_h2)
            .map(|h| h.line)
            .unwrap_or(lines.len());

        let mut fence_open: Option<usize> = None;
        let mut fence_close: Option<usize> = None;

        for i in (comp_h2 + 1)..search_end {
            if fence_open.is_none() && fence_open_re.is_match(lines[i]) {
                fence_open = Some(i);
                continue;
            }
            if fence_open.is_some() && fence_close_re.is_match(lines[i]) {
                fence_close = Some(i);
                break;
            }
        }

        match (fence_open, fence_close) {
            (None, _) => {
                violations.push(v(
                    comp_h2 + 1,
                    "missing fenced ```yaml block under \"## Components\".".to_string(),
                ));
            }
            (Some(fo), None) => {
                violations.push(v(
                    fo + 1,
                    "unclosed ```yaml fence under \"## Components\".".to_string(),
                ));
            }
            (Some(fo), Some(fc)) => {
                for i in (fo + 1)..fc {
                    let raw = lines[i];
                    if raw.is_empty() {
                        continue;
                    }
                    if raw.starts_with("<!--") {
                        continue;
                    }
                    if raw.starts_with(char::is_whitespace) {
                        continue;
                    }
                    if let Some(caps) = atom_name_re.captures(raw) {
                        let name = caps[1].to_string();
                        if components.contains(&name) {
                            violations.push(v(i + 1, format!("duplicate atom name \"{}\".", name)));
                            continue;
                        }
                        components.insert(name);
                    } else {
                        violations.push(v(
                            i + 1,
                            format!(
                                "invalid column-0 line inside Components block (expected atom-name shape \"Name:\"): {}.",
                                serde_yaml::to_string(&serde_yaml::Value::String(raw.to_string()))
                                    .unwrap()
                                    .trim()
                            ),
                        ));
                    }
                }
            }
        }
    }

    // Parse tokens section.
    if let Some(tok_h2) = tokens_h2 {
        let search_end = h2_positions
            .iter()
            .find(|h| h.line > tok_h2)
            .map(|h| h.line)
            .unwrap_or(lines.len());

        for i in (tok_h2 + 1)..search_end {
            let raw = lines[i];
            if raw.is_empty() {
                continue;
            }
            if raw.trim_start().starts_with("<!--") {
                continue;
            }
            if raw.starts_with(char::is_whitespace) {
                violations.push(v(
                    i + 1,
                    format!(
                        "token line has leading whitespace: {}.",
                        serde_yaml::to_string(&serde_yaml::Value::String(raw.to_string()))
                            .unwrap()
                            .trim()
                    ),
                ));
                continue;
            }
            if raw.starts_with("- ") {
                violations.push(v(
                    i + 1,
                    format!(
                        "token line has bullet prefix \"- \" (not allowed): {}.",
                        serde_yaml::to_string(&serde_yaml::Value::String(raw.to_string()))
                            .unwrap()
                            .trim()
                    ),
                ));
                continue;
            }
            if tokens.contains(raw) {
                violations.push(v(i + 1, format!("duplicate token \"{}\".", raw)));
                continue;
            }
            tokens.insert(raw.to_string());
        }
    }

    ParseFactResult {
        atoms: FactAtoms { components, tokens },
        violations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_FACT: &str = "<!-- AUTO-GENERATED by the Pastiche FACT extractor. Do not edit by hand. -->\n\n## Components\n\n```yaml\nButton:\n  pkg: \"@org/web\"\n  variant?: [primary, secondary]\nIconButton:\n  pkg: \"@org/web\"\nForm.Input:\n  pkg: \"@org/form\"\n  name: string\nAvatar: { pkg: \"@org/x\" }\n```\n\n## Tokens\n\n--color-brand-primary\n--color-foreground\n.type-display\n";

    #[test]
    fn valid_fact_atoms_extracted_zero_violations() {
        let r = parse_and_validate_fact(VALID_FACT);
        assert!(r.violations.is_empty(), "got: {:?}", r.violations);
        let mut comps: Vec<_> = r.atoms.components.into_iter().collect();
        comps.sort();
        assert_eq!(comps, vec!["Avatar", "Button", "Form.Input", "IconButton"]);
        let mut toks: Vec<_> = r.atoms.tokens.into_iter().collect();
        toks.sort();
        assert_eq!(toks, vec!["--color-brand-primary", "--color-foreground", ".type-display"]);
    }

    #[test]
    fn missing_components_h2() {
        let bad = VALID_FACT.replace("## Components\n", "");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("## Components")));
    }

    #[test]
    fn missing_tokens_h2() {
        let bad = VALID_FACT.replace("## Tokens", "## Other");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("## Tokens")));
    }

    #[test]
    fn missing_fenced_yaml_block() {
        let bad = "## Components\n\n(no fence here)\n\n## Tokens\n\n--foo\n";
        let r = parse_and_validate_fact(bad);
        assert!(r.violations.iter().any(|v| v.message.contains("fenced") && v.message.contains("yaml")));
    }

    #[test]
    fn unclosed_fence() {
        let bad = "## Components\n\n```yaml\nButton:\n  pkg: \"@org/web\"\n\n## Tokens\n";
        let r = parse_and_validate_fact(bad);
        assert!(r.violations.iter().any(|v| v.message.contains("unclosed")));
    }

    #[test]
    fn invalid_column0_line() {
        let bad = VALID_FACT.replace("Form.Input:", "stray prose here\nForm.Input:");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("column-0") || v.message.contains("invalid")));
    }

    #[test]
    fn duplicate_atom_name() {
        let bad = VALID_FACT.replace(
            "IconButton:\n  pkg: \"@org/web\"",
            "IconButton:\n  pkg: \"@org/web\"\nButton:\n  pkg: \"@org/web\"",
        );
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("duplicate atom") && v.message.contains("Button")));
    }

    #[test]
    fn token_leading_whitespace() {
        let bad = VALID_FACT.replace("--color-brand-primary", "  --color-brand-primary");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("leading whitespace")));
    }

    #[test]
    fn token_bullet_prefix() {
        let bad = VALID_FACT.replace("--color-brand-primary", "- --color-brand-primary");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("bullet prefix")));
    }

    #[test]
    fn duplicate_token() {
        let bad = VALID_FACT.replace("--color-foreground", "--color-brand-primary");
        let r = parse_and_validate_fact(&bad);
        assert!(r.violations.iter().any(|v| v.message.contains("duplicate token") && v.message.contains("--color-brand-primary")));
    }

    #[test]
    fn lenient_atom_name_shape() {
        let t = "## Components\n\n```yaml\nlowercase_atom:\n  pkg: \"@org/x\"\nForm.Input:\n  pkg: \"@org/x\"\nMDX_Heading:\n  pkg: \"@org/x\"\n```\n\n## Tokens\n\n--foo\n";
        let r = parse_and_validate_fact(t);
        assert!(r.violations.is_empty(), "got: {:?}", r.violations);
        assert!(r.atoms.components.contains("lowercase_atom"));
        assert!(r.atoms.components.contains("Form.Input"));
        assert!(r.atoms.components.contains("MDX_Heading"));
    }
}
