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
  const userInOpenSection = {
    author_is_admin: 0,
    section_admin_only_topics: 0,
  };

  it('never redacts for authenticated viewers', () => {
    assert.equal(shouldRedactAnonymousMedia(userInOpenSection, true), false);
  });

  it('keeps all posts public in admin-only sections', () => {
    assert.equal(shouldRedactAnonymousMedia(adminInAdminSection, false), false);
    assert.equal(shouldRedactAnonymousMedia(userInAdminSection, false), false);
  });

  it('redacts media outside admin-only sections', () => {
    assert.equal(shouldRedactAnonymousMedia(adminInOpenSection, false), true);
    assert.equal(shouldRedactAnonymousMedia(userInOpenSection, false), true);
  });
});
