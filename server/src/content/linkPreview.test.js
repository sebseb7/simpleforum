import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSafePreviewUrl,
  parseLinkPreviewHtml,
  _clearLinkPreviewCache,
} from './linkPreview.js';
import { extractLinkUrls } from '../../../shared/extractLinkUrls.js';

describe('extractLinkUrls', () => {
  it('collects unique http(s) anchors in order', () => {
    const html =
      '<p><a href="https://a.example/x">A</a> and <a href="http://b.example">B</a> ' +
      '<a href="https://a.example/x#frag">dup</a> <a href="mailto:x@y.z">mail</a></p>';
    assert.deepEqual(extractLinkUrls(html), [
      'https://a.example/x',
      'http://b.example/',
    ]);
  });

  it('respects max', () => {
    const html = '<a href="https://1.example"></a><a href="https://2.example"></a>';
    assert.deepEqual(extractLinkUrls(html, { max: 1 }), ['https://1.example/']);
  });
});

describe('assertSafePreviewUrl', () => {
  it('allows public https', () => {
    assert.equal(assertSafePreviewUrl('https://example.com/path').hostname, 'example.com');
  });

  it('blocks localhost and private IPs', () => {
    assert.throws(() => assertSafePreviewUrl('http://localhost/x'), (e) => e.code === 'blocked_host');
    assert.throws(() => assertSafePreviewUrl('http://127.0.0.1/'), (e) => e.code === 'blocked_host');
    assert.throws(() => assertSafePreviewUrl('http://192.168.1.1/'), (e) => e.code === 'blocked_host');
    assert.throws(() => assertSafePreviewUrl('http://10.0.0.2/'), (e) => e.code === 'blocked_host');
  });

  it('rejects non-http schemes', () => {
    assert.throws(() => assertSafePreviewUrl('javascript:alert(1)'), (e) => e.code === 'invalid_url');
    assert.throws(() => assertSafePreviewUrl('file:///etc/passwd'), (e) => e.code === 'invalid_url');
  });
});

describe('parseLinkPreviewHtml', () => {
  it('prefers Open Graph fields', () => {
    _clearLinkPreviewCache();
    const html = `
      <html><head>
        <title>Doc Title</title>
        <meta property="og:title" content="OG Title &amp; More" />
        <meta property="og:description" content="Hello world" />
        <meta property="og:image" content="/img/og.png" />
        <meta property="og:site_name" content="Example" />
        <link rel="icon" href="/icon.png" />
      </head></html>`;
    const preview = parseLinkPreviewHtml(html, 'https://example.com/page');
    assert.equal(preview.title, 'OG Title & More');
    assert.equal(preview.description, 'Hello world');
    assert.equal(preview.image, 'https://example.com/img/og.png');
    assert.equal(preview.favicon, 'https://example.com/icon.png');
    assert.equal(preview.siteName, 'Example');
  });

  it('falls back to title and favicon.ico', () => {
    const html = `<html><head><title>Only Title</title></head></html>`;
    const preview = parseLinkPreviewHtml(html, 'https://example.com/a');
    assert.equal(preview.title, 'Only Title');
    assert.equal(preview.image, '');
    assert.equal(preview.favicon, 'https://example.com/favicon.ico');
  });
});
