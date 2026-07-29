import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { broadcast } from '../sse.js';

export default function createStarsRouter(store) {
  const router = Router();

  router.post('/stars', requireAuth, (req, res) => {
    const { targetType, targetId } = req.body || {};
    if (!['topic', 'post'].includes(targetType) || !targetId) {
      return res.status(400).json({ error: 'targetType and targetId required' });
    }
    const id = Number(targetId);

    if (targetType === 'topic') {
      if (!store.topics.findById.get(id)) {
        return res.status(404).json({ error: 'Topic not found' });
      }
    } else if (!store.posts.findById.get(id)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = store.stars.exists.get(req.user.id, targetType, id);
    if (!existing) {
      store.stars.insert.run(req.user.id, targetType, id);
    }
    const starCount = store.stars.count.get(targetType, id).count;
    broadcast({
      type: 'star.changed',
      payload: { targetType, targetId: id, starCount },
    });
    return res.json({ starred: true, starCount, targetType, targetId: id });
  });

  router.delete('/stars', requireAuth, (req, res) => {
    const { targetType, targetId } = req.body || {};
    if (!['topic', 'post'].includes(targetType) || !targetId) {
      return res.status(400).json({ error: 'targetType and targetId required' });
    }
    const id = Number(targetId);
    store.stars.delete.run(req.user.id, targetType, id);
    const starCount = store.stars.count.get(targetType, id).count;
    broadcast({
      type: 'star.changed',
      payload: { targetType, targetId: id, starCount },
    });
    return res.json({ starred: false, starCount, targetType, targetId: id });
  });

  router.get('/stars/mine', requireAuth, (req, res) => {
    const topics = store.stars.listMineTopics.all(req.user.id).map((row) => ({
      targetType: 'topic',
      id: row.id,
      sectionId: row.section_id,
      title: row.title,
      slug: row.slug,
      bodyHtml: row.body_html,
      authorId: row.author_id,
      authorName: row.author_name,
      isClosed: !!row.is_closed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      postCount: row.post_count,
      starCount: row.star_count,
    }));
    const posts = store.stars.listMinePosts.all(req.user.id).map((row) => ({
      targetType: 'post',
      id: row.id,
      topicId: row.topic_id,
      topicSlug: row.topic_slug,
      bodyHtml: row.body_html,
      authorId: row.author_id,
      authorName: row.author_name,
      createdAt: row.created_at,
      starCount: row.star_count,
    }));
    return res.json({ topics, posts });
  });

  return router;
}
