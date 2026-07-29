-- name: insert
-- api: POST /stars
-- params: user_id, target_type, target_id
INSERT INTO stars (user_id, target_type, target_id)
VALUES (?, ?, ?);

-- name: delete
-- api: DELETE /stars
-- params: user_id, target_type, target_id
DELETE FROM stars WHERE user_id = ? AND target_type = ? AND target_id = ?;

-- name: count
-- api: POST /stars ; DELETE /stars
-- params: target_type, target_id
SELECT COUNT(*) AS count FROM stars WHERE target_type = ? AND target_id = ?;

-- name: exists
-- api: POST /stars
-- params: user_id, target_type, target_id
SELECT id FROM stars WHERE user_id = ? AND target_type = ? AND target_id = ?;

-- name: listMineTopics
-- api: GET /stars/mine
-- params: user_id
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s2 WHERE s2.target_type = 'topic' AND s2.target_id = t.id) AS star_count,
  'topic' AS target_type
FROM stars s
JOIN topics t ON t.id = s.target_id
JOIN users u ON u.id = t.author_id
WHERE s.user_id = ? AND s.target_type = 'topic'
ORDER BY s.created_at DESC;

-- name: listMinePosts
-- api: GET /stars/mine
-- params: user_id
SELECT
  p.id, p.topic_id, p.body_html, p.author_id, p.created_at,
  t.slug AS topic_slug,
  u.name AS author_name,
  (SELECT COUNT(*) FROM stars s2 WHERE s2.target_type = 'post' AND s2.target_id = p.id) AS star_count,
  'post' AS target_type
FROM stars s
JOIN posts p ON p.id = s.target_id
JOIN topics t ON t.id = p.topic_id
JOIN users u ON u.id = p.author_id
WHERE s.user_id = ? AND s.target_type = 'post'
ORDER BY s.created_at DESC;

-- name: listUserStarsForTopics
-- api: GET /topics/:idOrSlug ; GET /sections/:idOrSlug/topics
-- params: user_id
SELECT target_id FROM stars WHERE user_id = ? AND target_type = 'topic';

-- name: listUserStarsForPosts
-- api: GET /topics/:idOrSlug
-- params: user_id
SELECT target_id FROM stars WHERE user_id = ? AND target_type = 'post';
