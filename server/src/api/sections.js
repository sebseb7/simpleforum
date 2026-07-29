import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../auth.js';
import { broadcast } from '../sse.js';

const SUPPORTED_SECTION_LANGS = new Set(['en', 'de']);

function normalizeLang(value, fallback = 'en') {
  const lang = String(value || fallback).toLowerCase().slice(0, 2);
  return SUPPORTED_SECTION_LANGS.has(lang) ? lang : fallback;
}

function mapSection(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lang: row.lang || 'en',
    adminOnlyTopics: !!row.admin_only_topics,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    topicCount: row.topic_count ?? 0,
  };
}

function mapTopic(row, starredIds = null) {
  if (!row) return null;
  return {
    id: row.id,
    sectionId: row.section_id,
    sectionTitle: row.section_title || null,
    title: row.title,
    bodyHtml: row.body_html,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPicture: row.author_picture || null,
    isClosed: !!row.is_closed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    postCount: row.post_count ?? 0,
    starCount: row.star_count ?? 0,
    starredByMe: starredIds ? starredIds.has(row.id) : false,
  };
}

export default function createSectionsRouter(store) {
  const router = Router();

  router.get('/sections', (req, res) => {
    const all = req.query.all === '1' || req.query.all === 'true';
    const rows = all
      ? store.sections.list.all()
      : store.sections.listByLang.all(normalizeLang(req.query.lang));
    res.json({ sections: rows.map(mapSection) });
  });

  router.post('/sections', requireAuth, requireAdmin, (req, res) => {
    const {
      title,
      description = '',
      adminOnlyTopics = false,
      sortOrder = 0,
      lang = 'en',
    } = req.body || {};
    if (!title?.trim()) {
      return res.status(400).json({ error: 'title required' });
    }
    const result = store.sections.insert.run(
      title.trim(),
      description || '',
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
    const title = req.body.title ?? existing.title;
    const description = req.body.description ?? existing.description;
    const lang =
      req.body.lang !== undefined ? normalizeLang(req.body.lang) : normalizeLang(existing.lang);
    const adminOnlyTopics =
      req.body.adminOnlyTopics !== undefined
        ? !!req.body.adminOnlyTopics
        : !!existing.admin_only_topics;
    const sortOrder =
      req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : existing.sort_order;

    store.sections.update.run(
      title,
      description,
      lang,
      adminOnlyTopics ? 1 : 0,
      sortOrder,
      id,
    );
    const section = mapSection(store.sections.findById.get(id));
    broadcast({ type: 'section.updated', payload: { sectionId: section.id } });
    return res.json({ section });
  });

  router.get('/sections/:id/topics', optionalAuth, (req, res) => {
    const sectionId = Number(req.params.id);
    const section = store.sections.findById.get(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    let starredIds = null;
    if (req.user) {
      starredIds = new Set(
        store.stars.listUserStarsForTopics.all(req.user.id).map((r) => r.target_id),
      );
    }
    const topics = store.topics.listBySection.all(sectionId).map((row) => mapTopic(row, starredIds));
    return res.json({ section: mapSection(section), topics });
  });

  router.post('/sections/:id/topics', requireAuth, (req, res) => {
    const sectionId = Number(req.params.id);
    const section = store.sections.findById.get(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    if (section.admin_only_topics && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create topics in this section' });
    }
    const { title, bodyHtml = '' } = req.body || {};
    if (!title?.trim()) {
      return res.status(400).json({ error: 'title required' });
    }
    const result = store.topics.insert.run(
      sectionId,
      title.trim(),
      bodyHtml || '',
      req.user.id,
    );
    const topic = mapTopic(store.topics.findById.get(result.lastInsertRowid));
    broadcast({
      type: 'topic.created',
      payload: { topicId: topic.id, sectionId },
    });
    return res.status(201).json({ topic });
  });

  return router;
}

export { mapTopic, mapSection };
