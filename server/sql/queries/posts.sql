-- name: listByTopic
-- api: GET /topics/:idOrSlug ; SSG loadPageData (/topic/:slug)
-- params: topic_id, limit, offset
SELECT
  p.id, p.topic_id, p.body_html, p.author_id, p.created_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'post' AND s.target_id = p.id) AS star_count
FROM posts p
JOIN users u ON u.id = p.author_id
JOIN topics t ON t.id = p.topic_id
JOIN sections sec ON sec.id = t.section_id
WHERE p.topic_id = ?
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: countByTopic
-- api: GET /topics/:idOrSlug ; SSG loadPageData (/topic/:slug)
-- params: topic_id
SELECT COUNT(*) AS n FROM posts WHERE topic_id = ?;

-- name: findById
-- api: POST /topics/:id/posts ; PATCH /posts/:id ; DELETE /posts/:id ; POST /stars ; DELETE /me
-- params: id
SELECT
  p.id, p.topic_id, p.body_html, p.author_id, p.created_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'post' AND s.target_id = p.id) AS star_count
FROM posts p
JOIN users u ON u.id = p.author_id
JOIN topics t ON t.id = p.topic_id
JOIN sections sec ON sec.id = t.section_id
WHERE p.id = ?;

-- name: insert
-- api: POST /topics/:id/posts
-- params: topic_id, body_html, author_id
INSERT INTO posts (topic_id, body_html, author_id)
VALUES (?, ?, ?);

-- name: update
-- api: PATCH /posts/:id
-- params: body_html, id
UPDATE posts SET body_html = ? WHERE id = ?;

-- name: delete
-- api: DELETE /posts/:id ; DELETE /me
-- params: id
DELETE FROM posts WHERE id = ?;

-- name: deleteStars
-- api: DELETE /posts/:id
-- params: post_id (target_id)
DELETE FROM stars WHERE target_type = 'post' AND target_id = ?;
