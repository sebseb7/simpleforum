import { mapSection, mapTopic } from '../api/sections.js';
import { mapPost } from '../api/topics.js';
import { SSG_LANG } from '../../../shared/ssgLang.js';
import de from '../../../client/src/i18n/locales/de.json' with { type: 'json' };
import {
  buildTopicDescription,
  buildTopicOgImageSource,
  canonicalUrl,
} from './pageMeta.js';
import {
  jsonLdHome,
  jsonLdPrivacy,
  jsonLdSection,
  jsonLdTopic,
} from './jsonLd.js';

const DEFAULT_DOCUMENT_TITLE = 'QuixPOS - Community Discussions';
const DEFAULT_DESCRIPTION = de.home.blurb;

const TOPICS_PAGE_SIZE = 20;
const POSTS_PAGE_SIZE = 50;

const anonymousAuth = {
  token: null,
  user: null,
  status: 'idle',
  error: null,
};

function emptyStars() {
  return {
    topics: [],
    posts: [],
    status: 'idle',
    error: null,
  };
}

function baseState(overrides) {
  return {
    auth: anonymousAuth,
    sections: {
      items: [],
      listMode: { lang: SSG_LANG },
      status: 'idle',
      error: null,
    },
    topics: {
      section: null,
      list: [],
      listTotal: 0,
      listOffset: 0,
      listLimit: TOPICS_PAGE_SIZE,
      current: null,
      listStatus: 'idle',
      currentStatus: 'idle',
      error: null,
      deletedNavigate: null,
    },
    posts: {
      byTopicId: {},
      window: null,
      status: 'idle',
      error: null,
    },
    stars: emptyStars(),
    ...overrides,
  };
}

function docTitle(title) {
  return title ? `${title} · QuixPOS` : DEFAULT_DOCUMENT_TITLE;
}

function baseMeta(partial = {}) {
  return {
    title: DEFAULT_DOCUMENT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    image: '',
    url: '',
    siteName: 'QuixPOS Forum',
    ...partial,
  };
}

/**
 * Build Redux prestate + document meta for a public URL (anonymous view).
 * @returns {{ preloadedState: object, meta: object, notFound?: boolean }}
 */
export function loadPageData(store, urlPath) {
  const path = String(urlPath || '/').split('?')[0] || '/';

  if (path === '/' || path === '') {
    const sections = store.sections.listByLang.all(SSG_LANG).map(mapSection);
    const meta = baseMeta({
      title: DEFAULT_DOCUMENT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: canonicalUrl('/'),
    });
    return {
      preloadedState: baseState({
        sections: {
          items: sections,
          listMode: { lang: SSG_LANG },
          status: 'succeeded',
          error: null,
        },
      }),
      meta,
      jsonLd: jsonLdHome({ meta, sections }),
    };
  }

  if (path === '/privacy') {
    const meta = baseMeta({
      title: docTitle(de.privacy.title),
      description: String(de.privacy.intro || DEFAULT_DESCRIPTION)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300),
      url: canonicalUrl('/privacy'),
    });
    return {
      preloadedState: baseState({}),
      meta,
      jsonLd: jsonLdPrivacy({ meta }),
    };
  }

  const sectionMatch = path.match(/^\/section\/([^/]+)\/?$/);
  if (sectionMatch) {
    const slug = decodeURIComponent(sectionMatch[1]);
    const sectionRow = store.sections.findBySlug.get(slug);
    if (!sectionRow) {
      return {
        preloadedState: baseState({}),
        meta: baseMeta({ url: canonicalUrl(path) }),
        notFound: true,
      };
    }
    const section = mapSection(sectionRow);
    const total = store.topics.countBySection.get(section.id)?.n ?? 0;
    const topicRows = store.topics.listBySection.all(
      section.id,
      TOPICS_PAGE_SIZE,
      0,
    );
    // Section list UI only needs titles/meta — omit bodies so SSG HTML stays
    // small and we don't AVIF-encode images that are never shown here.
    const topics = topicRows.map((row) => {
      const topic = mapTopic(row, null, { forAnonymous: true });
      return { ...topic, bodyHtml: '' };
    });

    const meta = baseMeta({
      title: docTitle(section.title),
      description: (section.description || DEFAULT_DESCRIPTION)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300),
      url: canonicalUrl(`/section/${section.slug}`),
    });

    return {
      preloadedState: baseState({
        topics: {
          section,
          list: topics,
          listTotal: total,
          listOffset: 0,
          listLimit: TOPICS_PAGE_SIZE,
          current: null,
          listStatus: 'succeeded',
          currentStatus: 'idle',
          error: null,
          deletedNavigate: null,
        },
      }),
      meta,
      jsonLd: jsonLdSection({ meta, section, topics }),
    };
  }

  const topicMatch = path.match(/^\/topic\/([^/]+)\/?$/);
  if (topicMatch) {
    const slug = decodeURIComponent(topicMatch[1]);
    const topicRow = store.topics.findBySlug.get(slug);
    if (!topicRow) {
      return {
        preloadedState: baseState({}),
        meta: baseMeta({ url: canonicalUrl(path) }),
        notFound: true,
      };
    }
    const topic = mapTopic(topicRow, null, { forAnonymous: true });
    const total = store.posts.countByTopic.get(topic.id)?.n ?? 0;
    const postRows = store.posts.listByTopic.all(topic.id, POSTS_PAGE_SIZE, 0);
    const posts = postRows.map((row) =>
      mapPost(row, null, { forAnonymous: true }),
    );

    const description =
      buildTopicDescription(
        topicRow.body_html,
        postRows.map((r) => r.body_html),
      ) || DEFAULT_DESCRIPTION;
    const imageSource = buildTopicOgImageSource(topicRow, postRows);
    const meta = baseMeta({
      title: docTitle(topic.title),
      description,
      type: 'article',
      url: canonicalUrl(`/topic/${topic.slug}`),
      image: imageSource?.kind === 'https' ? imageSource.url : '',
    });

    return {
      preloadedState: baseState({
        topics: {
          section: null,
          list: [],
          listTotal: 0,
          listOffset: 0,
          listLimit: TOPICS_PAGE_SIZE,
          current: topic,
          listStatus: 'idle',
          currentStatus: 'succeeded',
          error: null,
          deletedNavigate: null,
        },
        posts: {
          byTopicId: { [topic.id]: posts },
          window: {
            topicId: topic.id,
            total,
            offset: 0,
            limit: POSTS_PAGE_SIZE,
          },
          status: 'succeeded',
          error: null,
        },
      }),
      meta,
      ogImageSource: imageSource,
      ogAssetKey: `topic-${topic.slug}`,
      jsonLd: jsonLdTopic({ meta, topic }),
    };
  }

  return {
    preloadedState: baseState({}),
    meta: baseMeta({ url: canonicalUrl(path) }),
  };
}

/** All public paths to prerender from the DB. */
export function listPrerenderPaths(store) {
  const paths = ['/', '/privacy'];
  for (const row of store.sections.listSlugs.all()) {
    paths.push(`/section/${row.slug}`);
  }
  for (const row of store.topics.listSlugs.all()) {
    paths.push(`/topic/${row.slug}`);
  }
  return paths;
}
