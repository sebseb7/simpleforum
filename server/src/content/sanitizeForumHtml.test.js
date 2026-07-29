import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeForumHtml } from './sanitizeForumHtml.js';
import { sanitizePlainText } from './sanitizePlainText.js';
import { ContentValidationError } from './errors.js';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';

describe('sanitizePlainText', () => {
  it('strips tags and enforces length', () => {
    assert.equal(sanitizePlainText('<b>Hello</b>  world'), 'Hello world');
    assert.throws(
      () => sanitizePlainText('x'.repeat(CONTENT_LIMITS.titleMax + 1), { required: true }),
      (err) => err instanceof ContentValidationError && err.code === 'title_too_long',
    );
  });
});

describe('sanitizeForumHtml', () => {
  it('keeps safe quill-like markup', () => {
    const raw = '<p class="ql-align-center"><strong>Hi</strong></p>';
    const { html, contentFilter } = sanitizeForumHtml(raw);
    assert.match(html, /<strong>Hi<\/strong>/);
    assert.equal(contentFilter.changed, false);
  });

  it('does not flag Quill &nbsp; whitespace normalization', () => {
    const { contentFilter } = sanitizeForumHtml(
      '<p>Willkommen&nbsp;im&nbsp;QuixPOS&nbsp;Forum</p>',
      { required: true },
    );
    assert.equal(contentFilter.changed, false);
  });

  it('does not flag normal prose that contains on…= substrings', () => {
    for (const raw of [
      '<p>I only want a few words</p>',
      '<p>once = twice</p>',
      '<p>content=value in a sentence</p>',
    ]) {
      const { contentFilter } = sanitizeForumHtml(raw, { required: true });
      assert.equal(contentFilter.changed, false, raw);
    }
  });

  it('strips script and reports warning', () => {
    const { html, contentFilter } = sanitizeForumHtml(
      '<p>ok</p><script>alert(1)</script>',
      { required: true },
    );
    assert.equal(html.includes('script'), false);
    assert.equal(contentFilter.changed, true);
    assert.ok(contentFilter.warnings.some((w) => w.code === 'html_sanitized'));
  });

  it('strips javascript links', () => {
    const { html, contentFilter } = sanitizeForumHtml(
      '<p><a href="javascript:alert(1)">x</a></p>',
      { required: true },
    );
    assert.equal(/javascript:/i.test(html), false);
    assert.ok(contentFilter.warnings.some((w) => w.code === 'link_protocol_stripped'));
  });

  it('strips onerror handlers', () => {
    const { html } = sanitizeForumHtml(
      '<p><img src="https://example.com/a.png" onerror="alert(1)"></p>',
      { required: true },
    );
    assert.equal(/onerror/i.test(html), false);
    assert.match(html, /src="https:\/\/example.com\/a\.png"/);
  });

  it('rejects oversized body', () => {
    assert.throws(
      () => sanitizeForumHtml('a'.repeat(CONTENT_LIMITS.bodyHtmlMax + 1)),
      (err) => err instanceof ContentValidationError && err.code === 'body_too_large',
    );
  });

  it('rejects empty required body', () => {
    assert.throws(
      () => sanitizeForumHtml('<p><br></p>', { required: true }),
      (err) => err instanceof ContentValidationError && err.code === 'body_required',
    );
  });

  it('removes oversized data images', () => {
    // ~1KB of 'A' base64 payload is tiny; craft header claiming large by repeating.
    const big = 'A'.repeat(Math.ceil((CONTENT_LIMITS.maxImageBytes * 4) / 3) + 64);
    const raw = `<p>pic</p><img src="data:image/png;base64,${big}">`;
    const { html, contentFilter } = sanitizeForumHtml(raw, { required: true });
    assert.equal(/<img\b/i.test(html), false);
    assert.ok(
      contentFilter.warnings.some(
        (w) => w.code === 'image_too_large' || w.code === 'image_removed',
      ),
    );
  });

  it('allows https images and safe links', () => {
    const { html } = sanitizeForumHtml(
      '<p><a href="https://example.com">go</a><img src="https://cdn.example.com/x.webp" alt="x"></p>',
      { required: true },
    );
    assert.match(html, /href="https:\/\/example.com"/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, /src="https:\/\/cdn.example.com\/x.webp"/);
  });

  it('keeps quill-resize width and float styles', () => {
    const { html } = sanitizeForumHtml(
      '<p><img src="https://cdn.example.com/x.webp" width="240" style="width:50%;float:left;display:block;margin:auto;"></p>',
      { required: true },
    );
    assert.match(html, /width="240"/);
    assert.match(html, /width:50%/i);
    assert.match(html, /float:left/i);
    assert.match(html, /margin:\s*auto/i);
  });
});
