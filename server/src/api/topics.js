import { Router } from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../auth.js';
import { broadcast } from '../sse.js';
import { mapTopic, mapPost, allocateTopicSlug } from './sections.js';
import { parseWindow, windowMeta } from '../pagination.js';
import { validateTopicInput } from '../content/validate.js';
import { ContentValidationError, sendContentError } from '../content/errors.js';

/** Resolve topic by slug (preferred) or numeric id. */
function findTopic(store, key) {
  const raw = String(key ?? '');
  const bySlug = store.topics.findBySlug.get(raw);
  if (bySlug) return bySlug;
  if (/^\d+$/.test(raw)) {
    return store.topics.findById.get(Number(raw));
  }
  return null;
}

export default function createTopicsRouter(store) {
  const router = Router();

  router.get('/topics/:idOrSlug', optionalAuth, (req, res) => {
    const topicRow = findTopic(store, req.params.idOrSlug);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    const id = topicRow.id;

    const { offset, limit } = parseWindow(req.query, { defaultLimit: 50 });
    const forAnonymous = !req.user;

    let topicStarred = null;
    let postStarred = null;
    if (req.user) {
      topicStarred = new Set(
        store.stars.listUserStarsForTopics.all(req.user.id).map((r) => r.target_id),
      );
      postStarred = new Set(
        store.stars.listUserStarsForPosts.all(req.user.id).map((r) => r.target_id),
      );
    }

    const topic = mapTopic(topicRow, topicStarred, { forAnonymous });
    const total = store.posts.countByTopic.get(id)?.n ?? 0;
    const posts = store.posts.listByTopic
      .all(id, limit, offset)
      .map((row) => mapPost(row, postStarred, { forAnonymous }));
    return res.json({
      topic,
      posts,
      ...windowMeta(total, offset, limit),
    });
  });

  router.patch('/topics/:id/close', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const topicRow = store.topics.findById.get(id);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    if (topicRow.author_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Only the author or an admin can close this topic' });
    }
    store.topics.close.run(id);
    const topic = mapTopic(store.topics.findById.get(id));
    broadcast({
      type: 'topic.closed',
      payload: { topicId: id, sectionId: topic.sectionId },
    });
    return res.json({ topic });
  });

  router.patch('/topics/:id/pin', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const topicRow = store.topics.findById.get(id);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    const pinned =
      req.body?.pinned === undefined ? !topicRow.is_pinned : !!req.body.pinned;
    store.topics.setPinned.run(pinned ? 1 : 0, id);
    const topic = mapTopic(store.topics.findById.get(id));
    broadcast({
      type: 'topic.pinned',
      payload: {
        topicId: id,
        sectionId: topic.sectionId,
        isPinned: topic.isPinned,
      },
    });
    return res.json({ topic });
  });

  router.patch('/topics/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const topicRow = store.topics.findById.get(id);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    if (topicRow.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the topic author can edit it' });
    }
    const titleIn =
      req.body?.title !== undefined ? req.body.title : topicRow.title;
    const bodyIn =
      req.body?.bodyHtml !== undefined ? req.body.bodyHtml : topicRow.body_html;
    let title;
    let bodyHtml;
    let contentFilter;
    try {
      ({ title, bodyHtml, contentFilter } = validateTopicInput({
        title: titleIn,
        bodyHtml: bodyIn,
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }
    const slug =
      title === topicRow.title
        ? topicRow.slug
        : allocateTopicSlug(store, title, id);
    store.topics.update.run(title, slug, bodyHtml, id);
    const topic = mapTopic(store.topics.findById.get(id));
    broadcast({
      type: 'topic.updated',
      payload: { topicId: id, sectionId: topic.sectionId },
    });
    return res.json({ topic, contentFilter });
  });

  router.delete('/topics/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const topicRow = store.topics.findById.get(id);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    if (topicRow.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the topic creator can delete it' });
    }
    const sectionId = topicRow.section_id;
    const sectionSlug = topicRow.section_slug;
    const deleteAll = store.db.transaction(() => {
      store.topics.deleteStarsForTopic.run(id, id);
      store.topics.delete.run(id);
    });
    deleteAll();
    broadcast({
      type: 'topic.deleted',
      payload: { topicId: id, sectionId, sectionSlug },
    });
    return res.json({ ok: true, topicId: id, sectionId, sectionSlug });
  });

  return router;
}
