import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildTopicDescription,
  buildTopicOgImageSource,
  firstPublicImageSource,
  materializeOgImage,
  plainTextFromHtml,
  publicOgImageSourceFromRow,
} from './pageMeta.js';

describe('pageMeta', () => {
  it('strips tags for plain text', () => {
    assert.equal(plainTextFromHtml('<p>Hello <strong>world</strong></p>'), 'Hello world');
  });

  it('prefers https images over later data urls', () => {
    const html =
      '<p><img src="https://cdn.example/a.png" /><img src="data:image/png;base64,AAAA" /></p>';
    const src = firstPublicImageSource(html);
    assert.equal(src.kind, 'https');
    assert.equal(src.url, 'https://cdn.example/a.png');
  });

  it('parses data images for public admin rows', () => {
    const png1x1 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const publicRow = {
      body_html: `<p><img src="data:image/png;base64,${png1x1}" /></p>`,
      section_admin_only_topics: 1,
      author_is_admin: 1,
    };
    const privateRow = {
      body_html: `<p><img src="data:image/png;base64,${png1x1}" /></p>`,
      section_admin_only_topics: 0,
      author_is_admin: 0,
    };
    const pub = publicOgImageSourceFromRow(publicRow);
    assert.equal(pub.kind, 'data');
    assert.equal(pub.mime, 'image/png');
    assert.ok(pub.buffer.length > 10);
    assert.equal(publicOgImageSourceFromRow(privateRow), null);
  });

  it('builds description from topic then posts', () => {
    const desc = buildTopicDescription('<p>Topic intro</p>', [
      '<p>First reply with more text</p>',
    ]);
    assert.match(desc, /Topic intro/);
    assert.match(desc, /First reply/);
  });

  it('finds og image on a later public post', () => {
    const topic = {
      body_html: '<p>No image</p>',
      section_admin_only_topics: 1,
      author_is_admin: 1,
    };
    const posts = [
      {
        body_html: '<p>text</p>',
        section_admin_only_topics: 1,
        author_is_admin: 1,
      },
      {
        body_html: '<p><img src="https://cdn.example/from-post.webp" /></p>',
        section_admin_only_topics: 1,
        author_is_admin: 1,
      },
    ];
    const src = buildTopicOgImageSource(topic, posts);
    assert.equal(src.kind, 'https');
    assert.equal(src.url, 'https://cdn.example/from-post.webp');
  });

  it('writes data images into dist/og and returns absolute url', () => {
    const prev = process.env.CLIENT_ORIGIN;
    process.env.CLIENT_ORIGIN = 'https://forum.quixpos.com';
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'romanum-og-'));
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const url = materializeOgImage(dir, 'topic-cloud-tse-2', {
      kind: 'data',
      mime: 'image/png',
      buffer: png1x1,
    });
    assert.equal(url, 'https://forum.quixpos.com/og/topic-cloud-tse-2.png');
    assert.ok(fs.existsSync(path.join(dir, 'og', 'topic-cloud-tse-2.png')));
    if (prev === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = prev;
  });
});
