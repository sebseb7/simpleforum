import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  materializeDataImagesInHtml,
  parseDataImageUrl,
} from './materializeBodyImages.js';

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('materializeBodyImages', () => {
  it('parses data image urls', () => {
    const parsed = parseDataImageUrl(`data:image/png;base64,${PNG_1X1}`);
    assert.equal(parsed.mime, 'image/png');
    assert.ok(parsed.buffer.length > 10);
  });

  it('rewrites data imgs to /media/*.avif files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'romanum-media-'));
    const html = `<p></p><p><img src="data:image/png;base64,${PNG_1X1}" alt="x" /></p>`;
    const out = await materializeDataImagesInHtml(dir, html);
    assert.match(out, /src="\/media\/[a-f0-9]+\.avif"/);
    assert.equal(out.includes('data:image'), false);
    const file = out.match(/\/media\/([a-f0-9]+\.avif)/)[1];
    assert.ok(fs.existsSync(path.join(dir, 'media', file)));
    const size = fs.statSync(path.join(dir, 'media', file)).size;
    assert.ok(size > 0);
  });

  it('dedupes identical images to one file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'romanum-media-'));
    const html = `<img src="data:image/png;base64,${PNG_1X1}" /><img src="data:image/png;base64,${PNG_1X1}" />`;
    const out = await materializeDataImagesInHtml(dir, html);
    const files = fs.readdirSync(path.join(dir, 'media'));
    assert.equal(files.length, 1);
    assert.equal([...out.matchAll(/\/media\//g)].length, 2);
  });
});
