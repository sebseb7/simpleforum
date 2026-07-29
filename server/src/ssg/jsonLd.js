import { canonicalUrl, siteOrigin } from './pageMeta.js';

const SITE_NAME = 'QuixPOS Forum';

/**
 * SQLite `datetime('now')` / space-separated UTC → ISO-8601 with Z.
 * @param {string | null | undefined} value
 */
export function toIso8601Z(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const d = new Date(`${normalized}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function personNode(name) {
  const n = String(name || '').trim();
  if (!n) return undefined;
  return {
    '@type': 'Person',
    name: n,
  };
}

function imageNode(url) {
  if (!url) return undefined;
  return {
    '@type': 'ImageObject',
    url,
    contentUrl: url,
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${siteOrigin()}/#website`,
    name: SITE_NAME,
    url: siteOrigin(),
    inLanguage: 'de',
  };
}

/**
 * Home: CollectionPage whose mainEntity ItemList lists forum sections.
 */
export function jsonLdHome({ meta, sections }) {
  const items = (sections || []).map((section, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: section.title,
    description: section.description || undefined,
    url: canonicalUrl(`/section/${section.slug}`),
    item: {
      '@type': 'CollectionPage',
      name: section.title,
      description: section.description || undefined,
      url: canonicalUrl(`/section/${section.slug}`),
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteNode(),
      {
        '@type': 'CollectionPage',
        '@id': `${meta.url}#webpage`,
        url: meta.url,
        name: meta.title,
        description: meta.description,
        isPartOf: { '@id': `${siteOrigin()}/#website` },
        inLanguage: 'de',
        mainEntity: {
          '@type': 'ItemList',
          name: 'Forenbereiche',
          numberOfItems: items.length,
          itemListElement: items,
        },
      },
    ],
  };
}

/**
 * Section: CollectionPage whose mainEntity ItemList lists topics.
 */
export function jsonLdSection({ meta, section, topics }) {
  const items = (topics || []).map((topic, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: topic.title,
    url: canonicalUrl(`/topic/${topic.slug}`),
    item: {
      '@type': 'DiscussionForumPosting',
      headline: topic.title,
      url: canonicalUrl(`/topic/${topic.slug}`),
      datePublished: toIso8601Z(topic.createdAt),
      dateModified: toIso8601Z(topic.updatedAt),
      author: personNode(topic.authorName),
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteNode(),
      {
        '@type': 'CollectionPage',
        '@id': `${meta.url}#webpage`,
        url: meta.url,
        name: section?.title || meta.title,
        description: section?.description || meta.description,
        isPartOf: { '@id': `${siteOrigin()}/#website` },
        inLanguage: 'de',
        mainEntity: {
          '@type': 'ItemList',
          name: section?.title ? `Themen in ${section.title}` : 'Themen',
          numberOfItems: items.length,
          itemListElement: items,
        },
      },
    ],
  };
}

/**
 * Topic: DiscussionForumPosting (+ optional image).
 */
export function jsonLdTopic({ meta, topic }) {
  const posting = {
    '@type': 'DiscussionForumPosting',
    '@id': `${meta.url}#posting`,
    headline: topic?.title || meta.title,
    url: meta.url,
    description: meta.description,
    datePublished: toIso8601Z(topic?.createdAt),
    dateModified: toIso8601Z(topic?.updatedAt),
    inLanguage: 'de',
    isPartOf: { '@id': `${siteOrigin()}/#website` },
    author: personNode(topic?.authorName),
  };
  const image = imageNode(meta.image);
  if (image) posting.image = image;

  if (topic?.sectionSlug) {
    posting.articleSection = topic.sectionTitle || topic.sectionSlug;
    posting.isPartOf = [
      { '@id': `${siteOrigin()}/#website` },
      {
        '@type': 'CollectionPage',
        name: topic.sectionTitle || topic.sectionSlug,
        url: canonicalUrl(`/section/${topic.sectionSlug}`),
      },
    ];
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [websiteNode(), posting],
  };
}

export function jsonLdPrivacy({ meta }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: meta.url,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': `${siteOrigin()}/#website` },
    inLanguage: 'de',
  };
}

/** Safe JSON-LD script tag (escapes `<` for HTML embedding). */
export function jsonLdScriptTag(data) {
  if (!data) return '';
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
