/**
 * Canonical KNOWLEDGE section names + setup_progress keys.
 *
 * Single source of truth shared across:
 *   - `scripts/lint.ts` (canonical-section-presence check)
 *   - future template/config generation (not yet scripted in v1)
 *
 * Order matters: it matches the order in `templates/KNOWLEDGE.md` H2s and the
 * `setup_progress` key order in `templates/config.yaml`.
 */

export interface CanonicalSection {
  /** H2 display name as it appears in KNOWLEDGE.md, e.g., "Action buttons". */
  name: string;
  /** Kebab-case slug as used in `setup_progress` keys and `/pastiche-setup --section` flag values. */
  slug: string;
}

export const CANONICAL_SECTIONS: readonly CanonicalSection[] = [
  { name: 'Action buttons', slug: 'action-buttons' },
  { name: 'Forms & input collection', slug: 'forms-input-collection' },
  { name: 'Feedback & status', slug: 'feedback-status' },
  { name: 'Overlays', slug: 'overlays' },
  { name: 'Navigation & wayfinding', slug: 'navigation-wayfinding' },
  { name: 'Content display', slug: 'content-display' },
  { name: 'Layout & page structure', slug: 'layout-page-structure' },
  { name: 'Date & time selection', slug: 'date-time-selection' },
  { name: 'Iconography', slug: 'iconography' },
  { name: 'Visual hierarchy', slug: 'visual-hierarchy' },
  { name: 'Domain-specific patterns', slug: 'domain-specific-patterns' },
  { name: 'Brand Identity', slug: 'brand-identity' },
];

/**
 * The 13 `setup_progress` keys in `pastiche/config.yaml`, in declared order.
 * The first 12 mirror `CANONICAL_SECTIONS[*].slug`; `general-wisdom` is the
 * 13th, tracking `[GENERAL]` WISDOM rule curation progress.
 */
export const SETUP_PROGRESS_KEYS: readonly string[] = [
  ...CANONICAL_SECTIONS.map((s) => s.slug),
  'general-wisdom',
];

const NAME_TO_SLUG = new Map(CANONICAL_SECTIONS.map((s) => [s.name, s.slug]));
const SLUG_TO_NAME = new Map(CANONICAL_SECTIONS.map((s) => [s.slug, s.name]));

export function nameToSlug(name: string): string | undefined {
  return NAME_TO_SLUG.get(name);
}

export function slugToName(slug: string): string | undefined {
  return SLUG_TO_NAME.get(slug);
}
