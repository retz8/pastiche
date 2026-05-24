pub struct CanonicalSection {
    pub name: &'static str,
    pub slug: &'static str,
}

pub const CANONICAL_SECTIONS: &[CanonicalSection] = &[
    CanonicalSection { name: "Action buttons", slug: "action-buttons" },
    CanonicalSection { name: "Forms & input collection", slug: "forms-input-collection" },
    CanonicalSection { name: "Feedback & status", slug: "feedback-status" },
    CanonicalSection { name: "Overlays", slug: "overlays" },
    CanonicalSection { name: "Navigation & wayfinding", slug: "navigation-wayfinding" },
    CanonicalSection { name: "Content display", slug: "content-display" },
    CanonicalSection { name: "Layout & page structure", slug: "layout-page-structure" },
    CanonicalSection { name: "Date & time selection", slug: "date-time-selection" },
    CanonicalSection { name: "Iconography", slug: "iconography" },
    CanonicalSection { name: "Visual hierarchy", slug: "visual-hierarchy" },
    CanonicalSection { name: "Domain-specific patterns", slug: "domain-specific-patterns" },
    CanonicalSection { name: "Brand Identity", slug: "brand-identity" },
];

pub fn setup_progress_keys() -> Vec<&'static str> {
    let mut keys: Vec<&'static str> = CANONICAL_SECTIONS.iter().map(|s| s.slug).collect();
    keys.push("general-wisdom");
    keys
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_sections_has_12_entries_in_spec_order() {
        assert_eq!(CANONICAL_SECTIONS.len(), 12);
        assert_eq!(CANONICAL_SECTIONS[0].name, "Action buttons");
        assert_eq!(CANONICAL_SECTIONS[0].slug, "action-buttons");
        assert_eq!(CANONICAL_SECTIONS[11].name, "Brand Identity");
        assert_eq!(CANONICAL_SECTIONS[11].slug, "brand-identity");
    }

    #[test]
    fn canonical_sections_pairs_match() {
        let expected = [
            ("Action buttons", "action-buttons"),
            ("Forms & input collection", "forms-input-collection"),
            ("Feedback & status", "feedback-status"),
            ("Overlays", "overlays"),
            ("Navigation & wayfinding", "navigation-wayfinding"),
            ("Content display", "content-display"),
            ("Layout & page structure", "layout-page-structure"),
            ("Date & time selection", "date-time-selection"),
            ("Iconography", "iconography"),
            ("Visual hierarchy", "visual-hierarchy"),
            ("Domain-specific patterns", "domain-specific-patterns"),
            ("Brand Identity", "brand-identity"),
        ];
        for (i, (name, slug)) in expected.iter().enumerate() {
            assert_eq!(CANONICAL_SECTIONS[i].name, *name);
            assert_eq!(CANONICAL_SECTIONS[i].slug, *slug);
        }
    }

    #[test]
    fn setup_progress_keys_has_13_entries() {
        let keys = setup_progress_keys();
        assert_eq!(keys.len(), 13);
        assert_eq!(keys[12], "general-wisdom");
        for i in 0..12 {
            assert_eq!(keys[i], CANONICAL_SECTIONS[i].slug);
        }
    }
}
