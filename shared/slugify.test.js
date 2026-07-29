import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueSlug } from './slugify.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
  });

  it('maps German umlauts', () => {
    assert.equal(slugify('Allgemein - Deutsch'), 'allgemein-deutsch');
    assert.equal(slugify('Ankündigungen'), 'ankuendigungen');
    assert.equal(slugify('Größe'), 'groesse');
  });

  it('falls back for empty input', () => {
    assert.equal(slugify(''), 'item');
    assert.equal(slugify('!!!'), 'item');
  });
});

describe('uniqueSlug', () => {
  it('returns base when free', () => {
    assert.equal(uniqueSlug('Welcome', () => false), 'welcome');
  });

  it('appends numeric suffix when taken', () => {
    const taken = new Set(['welcome', 'welcome-2']);
    assert.equal(uniqueSlug('Welcome', (s) => taken.has(s)), 'welcome-3');
  });
});
