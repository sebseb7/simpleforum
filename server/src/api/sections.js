import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../auth.js';
import { broadcast } from '../sse.js';
import { parseWindow, windowMeta } from '../pagination.js';
import { validateTopicInput, validateSectionInput } from '../content/validate.js';
import { ContentValidationError, sendContentError } from '../content/errors.js';
import { redactAnonymousHtml } from '../../../shared/redactAnonymousHtml.js';
import { shouldRedactAnonymousMedia } from '../content/anonymousMedia.js';
import { uniqueSlug } from '../../../shared/slugify.js';
import { resolveWelcomeTopic, getSiteName } from './settings.js';

const SUPPORTED_SECTION_LANGS = new Set(['en', 'de']);
const HOME_TOP_STARRED = 3;

function normalizeLang(value, fallback = 'en') {
  const lang = String(value || fallback).toLowerCase().slice(0, 2);
  return SUPPORTED_SECTION_LANGS.has(lang) ? lang : fallback;
}

function mapSection(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    lang: row.lang || 'en',
    adminOnlyTopics: !!row.admin_only_topics,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    topicCount: row.topic_count ?? 0,
  };
}

function mapTopic(row, starredIds = null, { forAnonymous = false } = {}) {
  if (!row) return null;
  const bodyHtml = shouldRedactAnonymousMedia(row, !forAnonymous)
    ? redactAnonymousHtml(row.body_html)
    : row.body_html;
  return {
    id: row.id,
    sectionId: row.section_id,
    sectionTitle: row.section_title || null,
    sectionSlug: row.section_slug || null,
    title: row.title,
    slug: row.slug,
    bodyHtml,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPicture: row.author_picture || null,
    isClosed: !!row.is_closed,
    isPinned: !!row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    postCount: row.post_count ?? 0,
    starCount: row.star_count ?? 0,
    starredByMe: starredIds ? starredIds.has(row.id) : false,
  };
}

function mapPost(row, starredIds = null, { forAnonymous = false } = {}) {
  if (!row) return null;
  const bodyHtml = shouldRedactAnonymousMedia(row, !forAnonymous)
    ? redactAnonymousHtml(row.body_html)
    : row.body_html;
  return {
    id: row.id,
    topicId: row.topic_id,
    bodyHtml,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPicture: row.author_picture || null,
    createdAt: row.created_at,
    starCount: row.star_count ?? 0,
    starredByMe: starredIds ? starredIds.has(row.id) : false,
  };
}

/** Lightweight topic cards for homepage “most starred” (no body). */
function mapTopicHighlight(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    isClosed: !!row.is_closed,
    isPinned: !!row.is_pinned,
    starCount: row.star_count ?? 0,
    authorName: row.author_name,
  };
}

function sectionHighlights(store, sectionId, { forAnonymous = true } = {}) {
  // Pinned: full topic body for homepage embed; reply count only (no reply bodies).
  const pinned = store.topics.listPinnedBySection
    .all(sectionId)
    .map((row) => mapTopic(row, null, { forAnonymous }))
    .filter(Boolean);
  const topStarred = store.topics.listTopStarredBySection
    .all(sectionId, HOME_TOP_STARRED)
    .map(mapTopicHighlight);
  return { pinned, topStarred };
}

function mapSectionWithHighlights(store, row, opts = {}) {
  const section = mapSection(row);
  if (!section) return null;
  return { ...section, highlights: sectionHighlights(store, section.id, opts) };
}

/** Resolve section by slug (preferred) or numeric id. */
function findSection(store, key) {
  const raw = String(key ?? '');
  const bySlug = store.sections.findBySlug.get(raw);
  if (bySlug) return bySlug;
  if (/^\d+$/.test(raw)) {
    return store.sections.findById.get(Number(raw));
  }
  return null;
}

function allocateSectionSlug(store, title, excludeId = 0) {
  return uniqueSlug(title, (slug) => !!store.sections.slugExists.get(slug, excludeId));
}

function allocateTopicSlug(store, title, excludeId = 0) {
  return uniqueSlug(title, (slug) => !!store.topics.slugExists.get(slug, excludeId));
}

export default function createSectionsRouter(store) {
  const router = Router();

  router.get('/sections', optionalAuth, (req, res) => {
    const all = req.query.all === '1' || req.query.all === 'true';
    const rows = all
      ? store.sections.list.all()
      : store.sections.listByLang.all(normalizeLang(req.query.lang));
    // Home (lang filter) includes full pinned topic bodies + top-starred cards.
    // Admin "all" list stays lean without highlights.
    const forAnonymous = !req.user;
    const lang = normalizeLang(req.query.lang);
    const sections = all
      ? rows.map(mapSection)
      : rows.map((row) =>
          mapSectionWithHighlights(store, row, { forAnonymous }),
        );
    if (all) {
      return res.json({ sections, siteName: getSiteName(store) });
    }
    return res.json({
      sections,
      siteName: getSiteName(store),
      welcomeTopic: resolveWelcomeTopic(store, lang, { forAnonymous }),
    });
  });

  router.post('/sections', requireAuth, requireAdmin, (req, res) => {
    const {
      title,
      description = '',
      adminOnlyTopics = false,
      sortOrder = 0,
      lang = 'en',
    } = req.body || {};
    let cleanTitle;
    let cleanDescription;
    try {
      ({ title: cleanTitle, description: cleanDescription } = validateSectionInput({
        title,
        description,
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }
    const slug = allocateSectionSlug(store, cleanTitle);
    const result = store.sections.insert.run(
      cleanTitle,
      slug,
      cleanDescription,
      normalizeLang(lang),
      adminOnlyTopics ? 1 : 0,
      Number(sortOrder) || 0,
      req.user.id,
    );
    const section = mapSection(store.sections.findById.get(result.lastInsertRowid));
    broadcast({ type: 'section.created', payload: { sectionId: section.id } });
    return res.status(201).json({ section });
  });

  router.patch('/sections/:id', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const existing = store.sections.findById.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Section not found' });
    }
    let cleanTitle;
    let cleanDescription;
    try {
      ({ title: cleanTitle, description: cleanDescription } = validateSectionInput({
        title: req.body.title ?? existing.title,
        description: req.body.description ?? existing.description,
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }
    const lang =
      req.body.lang !== undefined ? normalizeLang(req.body.lang) : normalizeLang(existing.lang);
    const adminOnlyTopics =
      req.body.adminOnlyTopics !== undefined
        ? !!req.body.adminOnlyTopics
        : !!existing.admin_only_topics;
    const sortOrder =
      req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : existing.sort_order;

    const slug =
      cleanTitle === existing.title
        ? existing.slug
        : allocateSectionSlug(store, cleanTitle, id);

    store.sections.update.run(
      cleanTitle,
      slug,
      cleanDescription,
      lang,
      adminOnlyTopics ? 1 : 0,
      sortOrder,
      id,
    );
    const section = mapSection(store.sections.findById.get(id));
    broadcast({ type: 'section.updated', payload: { sectionId: section.id } });
    return res.json({ section });
  });

  router.get('/sections/:idOrSlug/topics', optionalAuth, (req, res) => {
    const section = findSection(store, req.params.idOrSlug);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const sectionId = section.id;
    const { offset, limit } = parseWindow(req.query, { defaultLimit: 20 });
    let starredIds = null;
    if (req.user) {
      starredIds = new Set(
        store.stars.listUserStarsForTopics.all(req.user.id).map((r) => r.target_id),
      );
    }
    const total = store.topics.countBySection.get(sectionId)?.n ?? 0;
    const topics = store.topics.listBySection
      .all(sectionId, limit, offset)
      .map((row) => mapTopic(row, starredIds, { forAnonymous: !req.user }));
    return res.json({
      section: mapSection(section),
      topics,
      ...windowMeta(total, offset, limit),
    });
  });

  router.post('/sections/:idOrSlug/topics', requireAuth, (req, res) => {
    const section = findSection(store, req.params.idOrSlug);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const sectionId = section.id;
    if (section.admin_only_topics && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create topics in this section' });
    }
    let title;
    let bodyHtml;
    let contentFilter;
    try {
      ({ title, bodyHtml, contentFilter } = validateTopicInput({
        title: req.body?.title,
        bodyHtml: req.body?.bodyHtml ?? '',
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }
    const slug = allocateTopicSlug(store, title);
    const result = store.topics.insert.run(
      sectionId,
      title,
      slug,
      bodyHtml,
      req.user.id,
    );
    const topic = mapTopic(store.topics.findById.get(result.lastInsertRowid));
    broadcast({
      type: 'topic.created',
      payload: { topicId: topic.id, sectionId },
    });
    return res.status(201).json({ topic, contentFilter });
  });

  return router;
}

export {
  mapTopic,
  mapPost,
  mapSection,
  mapSectionWithHighlights,
  findSection,
  allocateTopicSlug,
  allocateSectionSlug,
};
