import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  jsonLdHome,
  jsonLdSection,
  jsonLdTopic,
  jsonLdScriptTag,
  toIso8601Z,
} from './jsonLd.js';

describe('jsonLd', () => {
  it('home lists sections in ItemList', () => {
    const data = jsonLdHome({
      meta: {
        title: 'QuixPOS',
        description: 'Forum',
        url: 'https://forum.quixpos.com/',
      },
      sections: [
        { title: 'Allgemein', slug: 'allgemein-deutsch', description: 'Offen' },
        { title: 'News', slug: 'ankuendigungen-deutsch', description: '' },
      ],
    });
    const page = data['@graph'].find((n) => n['@type'] === 'CollectionPage');
    assert.equal(page.mainEntity['@type'], 'ItemList');
    assert.equal(page.mainEntity.numberOfItems, 2);
    assert.equal(page.mainEntity.itemListElement[0].name, 'Allgemein');
    assert.match(page.mainEntity.itemListElement[0].url, /\/section\/allgemein-deutsch/);
  });

  it('section lists topics in ItemList', () => {
    const data = jsonLdSection({
      meta: {
        title: 'Allgemein · QuixPOS',
        description: 'Offen',
        url: 'https://forum.quixpos.com/section/allgemein-deutsch',
      },
      section: { title: 'Allgemein', slug: 'allgemein-deutsch', description: 'Offen' },
      topics: [
        {
          title: 'Willkommen',
          slug: 'willkommen',
          authorName: 'QuixPOS',
          createdAt: '2026-01-01',
        },
      ],
    });
    const page = data['@graph'].find((n) => n['@type'] === 'CollectionPage');
    assert.equal(page.mainEntity.itemListElement[0].item['@type'], 'DiscussionForumPosting');
    assert.equal(page.mainEntity.itemListElement[0].name, 'Willkommen');
  });

  it('escapes < in script tag', () => {
    const tag = jsonLdScriptTag({ name: 'a</script>b' });
    assert.match(tag, /application\/ld\+json/);
    assert.equal(tag.includes('</script>b'), false);
    assert.match(tag, /\\u003c/);
  });

  it('toIso8601Z adds Z for sqlite datetimes', () => {
    assert.equal(toIso8601Z('2026-07-29 18:34:11'), '2026-07-29T18:34:11.000Z');
    assert.equal(toIso8601Z('2026-07-29T18:34:11Z'), '2026-07-29T18:34:11.000Z');
    assert.equal(toIso8601Z(''), undefined);
  });

  it('topic posting has ISO dates and ImageObject', () => {
    const data = jsonLdTopic({
      meta: {
        title: 'Cloud-TSE',
        description: 'Desc',
        url: 'https://forum.quixpos.com/topic/cloud-tse-2',
        image: 'https://forum.quixpos.com/og/topic-cloud-tse-2.png',
      },
      topic: {
        title: 'Cloud-TSE',
        authorName: 'Developer',
        createdAt: '2026-07-29 18:34:11',
        updatedAt: '2026-07-29 18:37:45',
        sectionSlug: 'ankuendigungen-deutsch',
        sectionTitle: 'Ankündigungen - Deutsch',
      },
    });
    const posting = data['@graph'].find((n) => n['@type'] === 'DiscussionForumPosting');
    assert.equal(posting.datePublished, '2026-07-29T18:34:11.000Z');
    assert.equal(posting.dateModified, '2026-07-29T18:37:45.000Z');
    assert.equal(posting.author.name, 'Developer');
    assert.equal(posting.image['@type'], 'ImageObject');
    assert.equal(posting.image.url, 'https://forum.quixpos.com/og/topic-cloud-tse-2.png');
  });
});
