import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { broadcast } from '../sse.js';
import { mapPost } from './topics.js';
import { validatePostInput } from '../content/validate.js';
import { ContentValidationError, sendContentError } from '../content/errors.js';

export default function createPostsRouter(store) {
  const router = Router();

  router.post('/topics/:id/posts', requireAuth, (req, res) => {
    const topicId = Number(req.params.id);
    const topic = store.topics.findById.get(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    if (topic.is_closed) {
      return res.status(403).json({ error: 'This topic is closed' });
    }
    let bodyHtml;
    let contentFilter;
    try {
      ({ bodyHtml, contentFilter } = validatePostInput({
        bodyHtml: req.body?.bodyHtml,
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }

    const insert = store.db.transaction(() => {
      const result = store.posts.insert.run(topicId, bodyHtml, req.user.id);
      store.topics.touch.run(topicId);
      return result.lastInsertRowid;
    });
    const postId = insert();
    const post = mapPost(store.posts.findById.get(postId));
    broadcast({
      type: 'post.created',
      payload: { postId: post.id, topicId, sectionId: topic.section_id },
    });
    return res.status(201).json({ post, contentFilter });
  });

  router.patch('/posts/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const postRow = store.posts.findById.get(id);
    if (!postRow) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (postRow.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the post author can edit it' });
    }
    let bodyHtml;
    let contentFilter;
    try {
      ({ bodyHtml, contentFilter } = validatePostInput({
        bodyHtml: req.body?.bodyHtml,
      }));
    } catch (err) {
      if (err instanceof ContentValidationError) return sendContentError(res, err);
      throw err;
    }
    const topic = store.topics.findById.get(postRow.topic_id);
    store.posts.update.run(bodyHtml, id);
    store.topics.touch.run(postRow.topic_id);
    const post = mapPost(store.posts.findById.get(id));
    broadcast({
      type: 'post.updated',
      payload: {
        postId: id,
        topicId: postRow.topic_id,
        sectionId: topic?.section_id,
      },
    });
    return res.json({ post, contentFilter });
  });

  router.delete('/posts/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const postRow = store.posts.findById.get(id);
    if (!postRow) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (postRow.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the post author can delete it' });
    }
    const topicId = postRow.topic_id;
    const topic = store.topics.findById.get(topicId);
    const remove = store.db.transaction(() => {
      store.posts.deleteStars.run(id);
      store.posts.delete.run(id);
      store.topics.touch.run(topicId);
    });
    remove();
    broadcast({
      type: 'post.deleted',
      payload: {
        postId: id,
        topicId,
        sectionId: topic?.section_id,
      },
    });
    return res.json({ ok: true, postId: id, topicId });
  });

  return router;
}
