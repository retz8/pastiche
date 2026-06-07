# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-03

### Added

- Initial release as a Claude Code plugin (`/plugin marketplace add retz8/pastiche`).
- Three-document hierarchy: auto-extracted `FACT.md`, curated `KNOWLEDGE.md`, atom-tagged `WISDOM.md`.
- Bounded doubt-defense loop: `pastiche-implementer-round1` → `pastiche-reviewer` → `pastiche-implementer-round2`.
- Skills: `/pastiche` (orchestrator), `/pastiche-init`, `/pastiche-setup`, `/pastiche-sync`, `/pastiche-lint`, `/pastiche-write-knowledge`, `/pastiche-write-wisdom`.
- FACT extractor for React component libraries (package types and source-dir modes, CSS-vars token parsing).
- Rust lint binary (`pastiche-lint`) enforcing document-format invariants (darwin/arm64).
- Reference adoption: `examples/github-primer-react/` (Next.js + `@primer/react`).
- Format docs (`docs/fact.md`, `docs/knowledge.md`, `docs/wisdom.md`, `docs/config.md`) and Claude Code adapter doc.
