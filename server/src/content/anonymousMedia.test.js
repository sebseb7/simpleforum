import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRedactAnonymousMedia } from './anonymousMedia.js';

describe('shouldRedactAnonymousMedia', () => {
  const adminInAdminSection = {
    author_is_admin: 1,
    section_admin_only_topics: 1,
  };
  const userInAdminSection = {
    author_is_admin: 0,
    section_admin_only_topics: 1,
  };
  const adminInOpenSection = {
    author_is_admin: 1,
    section_admin_only_topics: 0,
  };

  it('never redacts for authenticated viewers', () => {
    assert.equal(shouldRedactAnonymousMedia(userInAdminSection, true), false);
  });

  it('keeps admin posts public in admin sections', () => {
    assert.equal(shouldRedactAnonymousMedia(adminInAdminSection, false), false);
  });

  it('redacts user replies in admin sections', () => {
    assert.equal(shouldRedactAnonymousMedia(userInAdminSection, false), true);
  });

  it('redacts even admin authors outside admin sections', () => {
    assert.equal(shouldRedactAnonymousMedia(adminInOpenSection, false), true);
  });
});
