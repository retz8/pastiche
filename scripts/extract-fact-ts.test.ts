import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as extractor from './extract-fact-ts.ts';

test('module exports all pipeline stages', () => {
  assert.equal(typeof extractor.loadConfig, 'function');
  assert.equal(typeof extractor.extractTokens, 'function');
  assert.equal(typeof extractor.collectSourceFiles, 'function');
  assert.equal(typeof extractor.buildProject, 'function');
  assert.equal(typeof extractor.discoverComponentsForPackage, 'function');
  assert.equal(typeof extractor.renderFact, 'function');
});
