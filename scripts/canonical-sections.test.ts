import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_SECTIONS,
  SETUP_PROGRESS_KEYS,
  nameToSlug,
  slugToName,
} from './canonical-sections.ts';

test('CANONICAL_SECTIONS has exactly 12 entries in spec order', () => {
  assert.equal(CANONICAL_SECTIONS.length, 12);
  assert.equal(CANONICAL_SECTIONS[0].name, 'Action buttons');
  assert.equal(CANONICAL_SECTIONS[0].slug, 'action-buttons');
  assert.equal(CANONICAL_SECTIONS[11].name, 'Brand Identity');
  assert.equal(CANONICAL_SECTIONS[11].slug, 'brand-identity');
});

test('CANONICAL_SECTIONS pairs match name<->slug', () => {
  const expected: Array<[string, string]> = [
    ['Action buttons', 'action-buttons'],
    ['Forms & input collection', 'forms-input-collection'],
    ['Feedback & status', 'feedback-status'],
    ['Overlays', 'overlays'],
    ['Navigation & wayfinding', 'navigation-wayfinding'],
    ['Content display', 'content-display'],
    ['Layout & page structure', 'layout-page-structure'],
    ['Date & time selection', 'date-time-selection'],
    ['Iconography', 'iconography'],
    ['Visual hierarchy', 'visual-hierarchy'],
    ['Domain-specific patterns', 'domain-specific-patterns'],
    ['Brand Identity', 'brand-identity'],
  ];
  for (let i = 0; i < expected.length; i++) {
    assert.equal(CANONICAL_SECTIONS[i].name, expected[i][0]);
    assert.equal(CANONICAL_SECTIONS[i].slug, expected[i][1]);
  }
});

test('SETUP_PROGRESS_KEYS has 13 entries: 12 section slugs + general-wisdom', () => {
  assert.equal(SETUP_PROGRESS_KEYS.length, 13);
  assert.equal(SETUP_PROGRESS_KEYS[12], 'general-wisdom');
  for (let i = 0; i < 12; i++) {
    assert.equal(SETUP_PROGRESS_KEYS[i], CANONICAL_SECTIONS[i].slug);
  }
});

test('nameToSlug returns the slug for a canonical name', () => {
  assert.equal(nameToSlug('Action buttons'), 'action-buttons');
  assert.equal(nameToSlug('Brand Identity'), 'brand-identity');
});

test('nameToSlug returns undefined for an unknown name', () => {
  assert.equal(nameToSlug('Not A Section'), undefined);
});

test('slugToName returns the name for a canonical slug', () => {
  assert.equal(slugToName('action-buttons'), 'Action buttons');
  assert.equal(slugToName('brand-identity'), 'Brand Identity');
});

test('slugToName returns undefined for an unknown slug', () => {
  assert.equal(slugToName('not-a-slug'), undefined);
});
