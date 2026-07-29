import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth.js';
import { broadcast } from '../sse.js';
import { mapTopic } from './sections.js';

function mapPost(row, starredIds = null) {
  if (!row) return null;
  return {
    id: row.id,
    topicId: row.topic_id,
    bodyHtml: row.body_html,
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

    const topic = mapTopic(topicRow, topicStarred);
    const posts = store.posts.listByTopic.all(id).map((row) => mapPost(row, postStarred));
    return res.json({ topic, posts });
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
    const title =
      req.body?.title !== undefined ? String(req.body.title).trim() : topicRow.title;
    const bodyHtml =
      req.body?.bodyHtml !== undefined ? req.body.bodyHtml : topicRow.body_html;
    if (!title) {
      return res.status(400).json({ error: 'title required' });
    }
    store.topics.update.run(title, bodyHtml || '', id);
    const topic = mapTopic(store.topics.findById.get(id));
    broadcast({
      type: 'topic.updated',
      payload: { topicId: id, sectionId: topic.sectionId },
    });
    return res.json({ topic });
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
