-- name: insert
INSERT INTO stars (user_id, target_type, target_id)
VALUES (?, ?, ?);

-- name: delete
DELETE FROM stars WHERE user_id = ? AND target_type = ? AND target_id = ?;

-- name: count
SELECT COUNT(*) AS count FROM stars WHERE target_type = ? AND target_id = ?;

-- name: exists
SELECT id FROM stars WHERE user_id = ? AND target_type = ? AND target_id = ?;

-- name: listMineTopics
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.created_at, t.updated_at,
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
SELECT target_id FROM stars WHERE user_id = ? AND target_type = 'topic';

-- name: listUserStarsForPosts
SELECT target_id FROM stars WHERE user_id = ? AND target_type = 'post';
