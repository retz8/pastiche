use serde_yaml::Value;

use crate::canonical_sections::setup_progress_keys;
use crate::violation::{Violation, ViolationFamily};

const CFG: &str = "pastiche/config.yaml";
const PLATFORM_VALUES: &[&str] = &["claude-code", "codex"];
const SETUP_PROGRESS_VALUES: &[&str] = &["stub", "done"];

fn v(family: ViolationFamily, line: usize, message: String) -> Violation {
    Violation {
        family,
        file: CFG.to_string(),
        line,
        message,
    }
}

pub fn validate_config(raw: &str) -> Vec<Violation> {
    let mut violations = Vec::new();

    let parsed: Value = match serde_yaml::from_str(raw) {
        Ok(val) => val,
        Err(e) => {
            violations.push(v(ViolationFamily::Config, 1, format!("YAML parse error: {}", e)));
            return violations;
        }
    };

    let obj = match parsed.as_mapping() {
        Some(m) => m,
        None => {
            violations.push(v(ViolationFamily::Config, 1, "config root must be a YAML map".to_string()));
            return violations;
        }
    };

    // --- Sentinels ---

    let platform = obj.get(&Value::String("platform".into()));
    let platform_str = platform.and_then(|v| v.as_str());
    if platform.is_none() || platform == Some(&Value::Null) {
        violations.push(v(ViolationFamily::Sentinel, 1, "platform not set \u{2014} run /pastiche-init.".to_string()));
    }

    let typecheck = obj.get(&Value::String("typecheck_command".into()));
    let _typecheck_str = typecheck.and_then(|v| v.as_str());
    if typecheck.is_none() || typecheck == Some(&Value::Null) {
        violations.push(v(ViolationFamily::Sentinel, 1, "typecheck_command not set \u{2014} run /pastiche-init.".to_string()));
    }

    let packages = obj.get(&Value::String("packages".into()));
    let tokens = obj.get(&Value::String("tokens".into()));
    let packages_empty = packages
        .and_then(|v| v.as_sequence())
        .map(|s| s.is_empty())
        .unwrap_or(false);
    let tokens_empty = tokens
        .and_then(|v| v.as_sequence())
        .map(|s| s.is_empty())
        .unwrap_or(false);
    if packages_empty && tokens_empty {
        violations.push(v(
            ViolationFamily::Sentinel,
            1,
            "declare at least one packages entry or one tokens file \u{2014} pastiche has nothing to extract.".to_string(),
        ));
    }

    // --- Schema ---

    if let Some(p) = platform_str {
        if !PLATFORM_VALUES.contains(&p) {
            violations.push(v(
                ViolationFamily::Config,
                1,
                format!(
                    "platform must be one of: {} (got {}).",
                    PLATFORM_VALUES.join(", "),
                    serde_yaml::to_string(&Value::String(p.to_string())).unwrap().trim()
                ),
            ));
        }
    }

    if let Some(pkgs_val) = packages {
        if pkgs_val != &Value::Null {
            match pkgs_val.as_sequence() {
                None => {
                    violations.push(v(ViolationFamily::Config, 1, "packages must be a list.".to_string()));
                }
                Some(seq) => {
                    let mut seen_names = std::collections::HashSet::new();
                    for (i, entry) in seq.iter().enumerate() {
                        let map = match entry.as_mapping() {
                            Some(m) => m,
                            None => {
                                violations.push(v(ViolationFamily::Config, 1, format!("packages[{}] must be a map.", i)));
                                continue;
                            }
                        };
                        let name_val = map.get(&Value::String("name".into()));
                        match name_val.and_then(|v| v.as_str()) {
                            None | Some("") => {
                                violations.push(v(
                                    ViolationFamily::Config,
                                    1,
                                    format!("packages[{}].name must be a non-empty string.", i),
                                ));
                            }
                            Some(name) => {
                                if !seen_names.insert(name.to_string()) {
                                    violations.push(v(
                                        ViolationFamily::Config,
                                        1,
                                        format!("duplicate package name \"{}\" in packages[{}].", name, i),
                                    ));
                                }
                            }
                        }
                        let has_types = map
                            .get(&Value::String("types".into()))
                            .map(|v| v != &Value::Null)
                            .unwrap_or(false);
                        let has_source_dir = map
                            .get(&Value::String("source_dir".into()))
                            .map(|v| v != &Value::Null)
                            .unwrap_or(false);
                        if has_types == has_source_dir {
                            violations.push(v(
                                ViolationFamily::Config,
                                1,
                                format!("packages[{}] must declare exactly one of types or source_dir.", i),
                            ));
                        }
                        if has_types {
                            let types_val = map.get(&Value::String("types".into()));
                            match types_val.and_then(|v| v.as_str()) {
                                Some(s) if !s.is_empty() => {}
                                _ => {
                                    violations.push(v(
                                        ViolationFamily::Config,
                                        1,
                                        format!("packages[{}].types must be a non-empty string.", i),
                                    ));
                                }
                            }
                        }
                        if has_source_dir {
                            let sd_val = map.get(&Value::String("source_dir".into()));
                            match sd_val.and_then(|v| v.as_str()) {
                                Some(s) if !s.is_empty() => {}
                                _ => {
                                    violations.push(v(
                                        ViolationFamily::Config,
                                        1,
                                        format!("packages[{}].source_dir must be a non-empty string.", i),
                                    ));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if let Some(tok_val) = tokens {
        if tok_val != &Value::Null {
            match tok_val.as_sequence() {
                None => {
                    violations.push(v(ViolationFamily::Config, 1, "tokens must be a list.".to_string()));
                }
                Some(seq) => {
                    for (i, t) in seq.iter().enumerate() {
                        match t.as_str() {
                            Some(s) if !s.is_empty() => {}
                            _ => {
                                violations.push(v(
                                    ViolationFamily::Config,
                                    1,
                                    format!("tokens[{}] must be a non-empty string.", i),
                                ));
                            }
                        }
                    }
                }
            }
        }
    }

    let design_ref = obj.get(&Value::String("design_md_reference".into()));
    if let Some(dr) = design_ref {
        if dr != &Value::Null && !dr.is_string() {
            violations.push(v(
                ViolationFamily::Config,
                1,
                "design_md_reference must be a string or null.".to_string(),
            ));
        }
    }

    if let Some(tc) = typecheck.filter(|v| *v != &Value::Null) {
        match tc.as_str() {
            Some(s) if !s.is_empty() => {}
            _ => {
                violations.push(v(
                    ViolationFamily::Config,
                    1,
                    "typecheck_command must be a non-empty string.".to_string(),
                ));
            }
        }
    }

    let sp = obj.get(&Value::String("setup_progress".into()));
    if let Some(sp_val) = sp {
        match sp_val.as_mapping() {
            None => {
                if sp_val != &Value::Null {
                    violations.push(v(ViolationFamily::Config, 1, "setup_progress must be a map.".to_string()));
                } else {
                    violations.push(v(ViolationFamily::Config, 1, "setup_progress must be a map.".to_string()));
                }
            }
            Some(sp_map) => {
                let expected_keys = setup_progress_keys();
                let expected_set: std::collections::HashSet<&str> =
                    expected_keys.iter().copied().collect();
                for required in &expected_keys {
                    if !sp_map.contains_key(&Value::String((*required).to_string())) {
                        violations.push(v(
                            ViolationFamily::Config,
                            1,
                            format!("setup_progress missing key \"{}\".", required),
                        ));
                    }
                }
                for (key, val) in sp_map {
                    let key_str = match key.as_str() {
                        Some(s) => s,
                        None => continue,
                    };
                    if !expected_set.contains(key_str) {
                        violations.push(v(
                            ViolationFamily::Config,
                            1,
                            format!("setup_progress has unexpected key \"{}\".", key_str),
                        ));
                        continue;
                    }
                    match val.as_str() {
                        Some(s) if SETUP_PROGRESS_VALUES.contains(&s) => {}
                        _ => {
                            violations.push(v(
                                ViolationFamily::Config,
                                1,
                                format!(
                                    "setup_progress.{} must be one of: {} (got {}).",
                                    key_str,
                                    SETUP_PROGRESS_VALUES.join(", "),
                                    serde_yaml::to_string(val).unwrap().trim()
                                ),
                            ));
                        }
                    }
                }
            }
        }
    }

    violations
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_CONFIG: &str = r#"
platform: claude-code
packages:
  - name: "@org/web"
    types: "node_modules/@org/web/dist/index.d.ts"
tokens:
  - "src/styles/tokens.css"
design_md_reference: null
typecheck_command: "tsc --noEmit"
setup_progress:
  action-buttons: stub
  forms-input-collection: stub
  feedback-status: stub
  overlays: stub
  navigation-wayfinding: stub
  content-display: stub
  layout-page-structure: stub
  date-time-selection: stub
  iconography: stub
  visual-hierarchy: stub
  domain-specific-patterns: stub
  brand-identity: stub
  general-wisdom: stub
"#;

    #[test]
    fn valid_config_zero_violations() {
        let r = validate_config(VALID_CONFIG);
        assert!(r.is_empty(), "expected no violations, got: {:?}", r);
    }

    #[test]
    fn malformed_yaml_single_violation() {
        let r = validate_config("platform: claude-code\n  bad: indent: here\n");
        assert_eq!(r.len(), 1);
        assert_eq!(r[0].family, ViolationFamily::Config);
        assert!(r[0].message.contains("YAML parse error"));
    }

    #[test]
    fn null_platform_sentinel() {
        let input = VALID_CONFIG.replace("platform: claude-code", "platform: null");
        let r = validate_config(&input);
        let sentinels: Vec<_> = r.iter().filter(|v| v.family == ViolationFamily::Sentinel).collect();
        assert_eq!(sentinels.len(), 1);
        assert!(sentinels[0].message.contains("platform not set"));
    }

    #[test]
    fn null_typecheck_sentinel() {
        let input = VALID_CONFIG.replace("typecheck_command: \"tsc --noEmit\"", "typecheck_command: null");
        let r = validate_config(&input);
        let sentinels: Vec<_> = r.iter().filter(|v| v.family == ViolationFamily::Sentinel).collect();
        assert_eq!(sentinels.len(), 1);
        assert!(sentinels[0].message.contains("typecheck_command not set"));
    }

    #[test]
    fn both_packages_and_tokens_empty_sentinel() {
        let input = r#"
platform: claude-code
packages: []
tokens: []
design_md_reference: null
typecheck_command: "tsc"
setup_progress:
  action-buttons: stub
  forms-input-collection: stub
  feedback-status: stub
  overlays: stub
  navigation-wayfinding: stub
  content-display: stub
  layout-page-structure: stub
  date-time-selection: stub
  iconography: stub
  visual-hierarchy: stub
  domain-specific-patterns: stub
  brand-identity: stub
  general-wisdom: stub
"#;
        let r = validate_config(input);
        assert!(r.iter().any(|v| v.message.contains("declare at least one packages entry or one tokens file")));
    }

    #[test]
    fn packages_alone_nonempty_is_fine() {
        let input = VALID_CONFIG.replace("tokens:\n  - \"src/styles/tokens.css\"", "tokens: []");
        let r = validate_config(&input);
        assert!(r.is_empty(), "got: {:?}", r);
    }

    #[test]
    fn tokens_alone_nonempty_is_fine() {
        let input = VALID_CONFIG.replace(
            "packages:\n  - name: \"@org/web\"\n    types: \"node_modules/@org/web/dist/index.d.ts\"",
            "packages: []",
        );
        let r = validate_config(&input);
        assert!(r.is_empty(), "got: {:?}", r);
    }

    #[test]
    fn unknown_platform_schema_violation() {
        let input = VALID_CONFIG.replace("platform: claude-code", "platform: vscode");
        let r = validate_config(&input);
        let cfg: Vec<_> = r.iter().filter(|v| v.family == ViolationFamily::Config).collect();
        assert_eq!(cfg.len(), 1);
        assert!(cfg[0].message.contains("platform must be one of: claude-code, codex"));
    }

    #[test]
    fn package_missing_name() {
        let input = VALID_CONFIG.replace(
            "  - name: \"@org/web\"\n    types: \"node_modules/@org/web/dist/index.d.ts\"",
            "  - types: \"node_modules/@org/web/dist/index.d.ts\"",
        );
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("packages[0].name")));
    }

    #[test]
    fn duplicate_package_names() {
        let input = VALID_CONFIG.replace(
            "  - name: \"@org/web\"\n    types: \"node_modules/@org/web/dist/index.d.ts\"",
            "  - name: \"@org/web\"\n    types: \"a.d.ts\"\n  - name: \"@org/web\"\n    types: \"b.d.ts\"",
        );
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("duplicate package name")));
    }

    #[test]
    fn package_with_both_types_and_source_dir() {
        let input = VALID_CONFIG.replace(
            "  - name: \"@org/web\"\n    types: \"node_modules/@org/web/dist/index.d.ts\"",
            "  - name: \"@org/web\"\n    types: \"a.d.ts\"\n    source_dir: \"src/components\"",
        );
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("exactly one of types or source_dir")));
    }

    #[test]
    fn package_with_neither_types_nor_source_dir() {
        let input = VALID_CONFIG.replace(
            "  - name: \"@org/web\"\n    types: \"node_modules/@org/web/dist/index.d.ts\"",
            "  - name: \"@org/web\"",
        );
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("exactly one of types or source_dir")));
    }

    #[test]
    fn setup_progress_missing_key() {
        let input = VALID_CONFIG.replace("  general-wisdom: stub\n", "");
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("setup_progress") && v.message.contains("general-wisdom")));
    }

    #[test]
    fn setup_progress_unknown_enum() {
        let input = VALID_CONFIG.replace("action-buttons: stub", "action-buttons: maybe");
        let r = validate_config(&input);
        assert!(r.iter().any(|v| v.message.contains("setup_progress.action-buttons") && v.message.contains("one of: stub, done")));
    }
}
