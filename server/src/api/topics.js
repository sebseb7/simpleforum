import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth.js';
import { broadcast } from '../sse.js';
import { mapTopic } from './sections.js';
import { parseWindow, windowMeta } from '../pagination.js';
import { validateTopicInput } from '../content/validate.js';
import { ContentValidationError, sendContentError } from '../content/errors.js';
import { redactAnonymousHtml } from '../../../shared/redactAnonymousHtml.js';
import { shouldRedactAnonymousMedia } from '../content/anonymousMedia.js';

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

export default function createTopicsRouter(store) {
  const router = Router();

  router.get('/topics/:id', optionalAuth, (req, res) => {
    const id = Number(req.params.id);
    const topicRow = store.topics.findById.get(id);
    if (!topicRow) {
      return res.status(404).json({ error: 'Topic not found' });
    }

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
    store.topics.update.run(title, bodyHtml, id);
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
    const deleteAll = store.db.transaction(() => {
      store.topics.deleteStarsForTopic.run(id, id);
      store.topics.delete.run(id);
    });
    deleteAll();
    broadcast({
      type: 'topic.deleted',
      payload: { topicId: id, sectionId },
    });
    return res.json({ ok: true, topicId: id, sectionId });
  });

  return router;
}

export { mapPost };
