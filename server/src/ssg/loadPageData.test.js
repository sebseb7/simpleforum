import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { openDatabase } from '../db.js';
import { listPrerenderPaths, loadPageData } from './loadPageData.js';

describe('SSG loadPageData', () => {
  let store;

  before(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'romanum-ssg-'));
    process.env.E2E_AUTH_SECRET = 'test'; // skip seed? Actually we WANT seed for slugs
    delete process.env.E2E_AUTH_SECRET;
    store = openDatabase(path.join(dir, 'test.sqlite'));
  });

  it('lists home, privacy, sections, and topics', () => {
    const paths = listPrerenderPaths(store);
    assert.ok(paths.includes('/'));
    assert.ok(paths.includes('/privacy'));
    assert.ok(paths.some((p) => p.startsWith('/section/')));
    assert.ok(paths.some((p) => p.startsWith('/topic/')));
  });

  it('loads home sections for SSG lang (de)', () => {
    const { preloadedState, meta } = loadPageData(store, '/');
    assert.equal(preloadedState.sections.status, 'succeeded');
    assert.equal(preloadedState.sections.listMode.lang, 'de');
    assert.ok(preloadedState.sections.items.every((s) => s.lang === 'de'));
    assert.match(meta.title, /QuixPOS/);
  });

  it('loads a section page', () => {
    const slug = store.sections.listSlugs.all()[0].slug;
    const { preloadedState, meta, notFound } = loadPageData(
      store,
      `/section/${slug}`,
    );
    assert.equal(notFound, undefined);
    assert.equal(preloadedState.topics.listStatus, 'succeeded');
    assert.equal(preloadedState.topics.section.slug, slug);
    assert.ok(meta.title.includes(preloadedState.topics.section.title));
  });

  it('marks unknown section as notFound', () => {
    const { notFound } = loadPageData(store, '/section/does-not-exist');
    assert.equal(notFound, true);
  });
});
