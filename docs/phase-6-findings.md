# Phase 6 — Findings

Each finding: description, context, severity, status.

---

- **Extractor emits flattened subcomponent names alongside (or instead of) dot-notation names.** `FormControl.Label` appears as `FormControlLabel`, `FormControl.Validation` as `FormControlValidation`, while `FormControl.Caption` appears in both forms. Primer's actual API is dot-notation (`<FormControl.Label>`); the flattened names are internal re-exports, not the consumer-facing API. Adopters writing KNOWLEDGE/WISDOM would use `FormControl.Label`, but FACT lists `FormControlLabel` — the atom names don't match how code is written. Context: extractor. Severity: blocker (KNOWLEDGE/WISDOM atom references won't match FACT, and generated code will use wrong import patterns). Status: fixed. Fix: broadened `detectCompound` to accept any PascalCase property in intersection type literals (not just `typeof` queries), deriving `innerName` from naming convention when `typeof` isn't present; added cross-file dedup in `dedupeComponents` to drop flattened names when a dot-notation form exists. 8 → 114 dot-notation entries; 279 → 239 components (40 flattened duplicates removed).
