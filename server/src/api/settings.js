import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth.js';
import { broadcast } from '../sse.js';
import { sanitizeForumHtml } from '../content/sanitizeForumHtml.js';
import { sanitizePlainText } from '../content/sanitizePlainText.js';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';
import { ContentValidationError, sendContentError } from '../content/errors.js';
import { redactAnonymousHtml } from '../../../shared/redactAnonymousHtml.js';
import { shouldRedactAnonymousMedia } from '../content/anonymousMedia.js';

function mapRootTopic(row, { forAnonymous = false, forEdit = false } = {}) {
  if (!row) return null;
  const title = String(row.title || '').trim();
  const rawBody = row.body_html || '';
  const hasBody = !!String(rawBody).replace(/<[^>]+>/g, '').trim();
  if (!forEdit && !title && !hasBody) return null;

  const bodyHtml = shouldRedactAnonymousMedia(
    {
      author_is_admin: row.author_is_admin,
      section_admin_only_topics: 1,
    },
    !forAnonymous,
  )
    ? redactAnonymousHtml(rawBody)
    : rawBody;

  return {
    isRoot: true,
    lang: row.lang,
    title: forEdit ? String(row.title || '') : title,
    bodyHtml: forEdit ? rawBody : bodyHtml,
    authorId: row.author_id ?? null,
    authorName: row.author_name || null,
    authorPicture: row.author_picture || null,
    updatedAt: row.updated_at,
    postCount: 0,
    slug: null,
  };
}

/** Homepage root topic for a UI language (null → no intro block). */
export function resolveWelcomeTopic(store, lang, { forAnonymous = true } = {}) {
  const key = lang === 'de' ? 'de' : 'en';
  return mapRootTopic(store.rootTopics.findByLang.get(key), { forAnonymous });
}

function emptyRoot(lang) {
  return {
    isRoot: true,
    lang,
    title: '',
    bodyHtml: '',
    authorId: null,
    authorName: null,
    authorPicture: null,
    updatedAt: null,
    postCount: 0,
    slug: null,
  };
}

export function getSiteName(store) {
  return String(store.settings.get.get('site_name')?.value || '').trim();
}

export function getRootSettings(store) {
  return {
    siteName: getSiteName(store),
    rootDe:
      mapRootTopic(store.rootTopics.findByLang.get('de'), {
        forAnonymous: false,
        forEdit: true,
      }) || emptyRoot('de'),
    rootEn:
      mapRootTopic(store.rootTopics.findByLang.get('en'), {
        forAnonymous: false,
        forEdit: true,
      }) || emptyRoot('en'),
  };
}

function validateRootInput({ title, bodyHtml }) {
  const cleanTitle = sanitizePlainText(title ?? '', {
    maxLen: CONTENT_LIMITS.titleMax,
    required: false,
    tooLongCode: 'title_too_long',
  });
  const { html, contentFilter } = sanitizeForumHtml(bodyHtml ?? '', {
    required: false,
  });
  return { title: cleanTitle, bodyHtml: html, contentFilter };
}

function saveRoot(store, lang, payload, authorId) {
  const { title, bodyHtml, contentFilter } = validateRootInput(payload || {});
  store.rootTopics.upsert.run(lang, title, bodyHtml, authorId);
  return { contentFilter };
}

export default function createSettingsRouter(store) {
  const router = Router();

  router.get('/settings', (_req, res) => {
    res.json(getRootSettings(store));
  });

  router.patch('/settings', requireAuth, requireAdmin, (req, res) => {
    const body = req.body || {};
    const filters = [];
    try {
      if (body.siteName !== undefined) {
        const siteName = sanitizePlainText(body.siteName ?? '', {
          maxLen: CONTENT_LIMITS.sectionTitleMax,
          required: false,
          tooLongCode: 'title_too_long',
        });
        store.settings.upsert.run('site_name', siteName);
      }
      if (body.rootDe !== undefined) {
        const { contentFilter } = saveRoot(store, 'de', body.rootDe, req.user.id);
        if (contentFilter) filters.push(contentFilter);
      }
      if (body.rootEn !== undefined) {
        const { contentFilter } = saveRoot(store, 'en', body.rootEn, req.user.id);
        if (contentFilter) filters.push(contentFilter);
      }
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }

    const settings = getRootSettings(store);
    broadcast({ type: 'settings.updated', payload: { siteName: settings.siteName } });
    return res.json({
      ...settings,
      contentFilter: filters.find((f) => f?.changed) || null,
    });
  });

  return router;
}
