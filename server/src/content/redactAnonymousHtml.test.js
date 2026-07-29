import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactAnonymousHtml } from '../../../shared/redactAnonymousHtml.js';

describe('redactAnonymousHtml', () => {
  it('replaces links and images', () => {
    const html =
      '<p>See <a href="https://evil.example/x">docs</a></p>' +
      '<p><img src="https://evil.example/a.png" alt="x"></p>';
    const out = redactAnonymousHtml(html);
    assert.equal(/href=|src=/i.test(out), false);
    assert.match(out, /data-forum-placeholder="link"/);
    assert.match(out, /data-forum-placeholder="image"/);
  });

  it('is idempotent', () => {
    const once = redactAnonymousHtml('<a href="https://x.test">x</a>');
    assert.equal(redactAnonymousHtml(once), once);
  });
});
