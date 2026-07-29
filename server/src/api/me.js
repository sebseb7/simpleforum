import { Router } from 'express';
import { requireAuth, publicUser } from '../auth.js';
import { broadcast } from '../sse.js';

export default function createMeRouter(store) {
  const router = Router();

  router.get('/me', requireAuth, (req, res) => {
    const user = store.users.findById.get(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    return res.json({ user: publicUser(user) });
  });

  router.patch('/me', requireAuth, (req, res) => {
    const user = store.users.findById.get(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const name =
      req.body?.name !== undefined ? String(req.body.name).trim() : user.name;
    if (!name) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    if (name.length > 80) {
      return res.status(400).json({ error: 'Display name is too long' });
    }

    const hideAvatar =
      req.body?.hideAvatar !== undefined
        ? req.body.hideAvatar
          ? 1
          : 0
        : user.hide_avatar;

    store.users.updateSettings.run(name, hideAvatar, user.id);
    const updated = store.users.findById.get(user.id);
    broadcast({
      type: 'user.updated',
      payload: { userId: user.id },
    });
    return res.json({ user: publicUser(updated) });
  });

  router.delete('/me', requireAuth, (req, res) => {
    const userId = req.user.id;
    const user = store.users.findById.get(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const topicIds = store.users.listTopicIdsByAuthor.all(userId).map((r) => r.id);
    const postIds = store.users.listPostIdsByAuthor.all(userId).map((r) => r.id);
    const sectionIdsAffected = new Set();

    const wipe = store.db.transaction(() => {
      for (const topicId of topicIds) {
        const topic = store.topics.findById.get(topicId);
        if (topic) sectionIdsAffected.add(topic.section_id);
        store.topics.deleteStarsForTopic.run(topicId, topicId);
        store.topics.delete.run(topicId);
      }

      for (const postId of postIds) {
        const post = store.posts.findById.get(postId);
        if (!post) continue;
        const topic = store.topics.findById.get(post.topic_id);
        if (topic) sectionIdsAffected.add(topic.section_id);
        store.users.deleteStarsForPost.run(postId);
        store.posts.delete.run(postId);
      }

      store.users.deleteStarsByUser.run(userId);
      store.users.clearSectionCreator.run(userId);
      store.users.delete.run(userId);
    });

    wipe();

    broadcast({
      type: 'account.deleted',
      payload: {
        userId,
        topicIds,
        sectionIds: [...sectionIdsAffected],
      },
    });

    return res.json({ ok: true });
  });

  return router;
}
