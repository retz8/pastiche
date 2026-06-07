# TODO

Post-v1 backlog. Tasks complete with no version change; when a group is done and review-approved, it ships as one minor bump (group = minor). Patch numbers are reserved for hotfixes between releases. Planned version numbers below are provisional — assigned for real at release time. Task numbers are TODO-ordinal (sub-tasks number as `<task>.<n>`); they are independent of GitHub issue numbers. (v1 delivery backlog archived at `_dev/archive/v1-development/TODO.md`.)

## 1.1.0 — Platform reach

- [ ] **1.** Add Codex support — take the shipped placeholder adapter to working end-to-end support on a real Codex install.
- [ ] **2.** Multi-arch lint distribution — restore the lint safety net on non-darwin/arm64 adopters.

## 1.2.0 — Onboarding

- [ ] **3.** Author `/pastiche-research-ds-docs` skill — crawl a design system's public docs into a structured research file, fed to setup as an optional source.
- [ ] **4.** Fluent UI full adoption example — real-product DS (Microsoft); first validation of the research-from-docs skill. *Depends on task 3.*

## 1.3.0 — Framework reach

- [ ] **5.** Vue extractor draft — `defineProps` discovery emitting the same FACT.md shape.
- [ ] **6.** Pajamas (GitLab UI) full adoption example — Vue real-product DS. *Depends on task 5.*

## 1.4.0 — Aesthetic review

- [ ] **7.** Aesthetic review skill — browser-based, designer's-perspective UI review (pacing, hierarchy, brand fit) loading Brand Identity from KNOWLEDGE. In-repo for now; whether it generalizes to a standalone skill is an open decision to revisit.
