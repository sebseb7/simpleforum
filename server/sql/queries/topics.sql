-- name: listBySection
SELECT
  t.id, t.section_id, t.title, t.body_html, t.author_id, t.is_closed, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  sec.title AS section_title,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.section_id = ?
ORDER BY t.updated_at DESC, t.id DESC;

-- name: findById
SELECT
  t.id, t.section_id, t.title, t.body_html, t.author_id, t.is_closed, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.email AS author_email,
  sec.title AS section_title,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.id = ?;

-- name: insert
INSERT INTO topics (section_id, title, body_html, author_id)
VALUES (?, ?, ?, ?);

-- name: close
UPDATE topics SET is_closed = 1, updated_at = datetime('now') WHERE id = ?;

-- name: touch
UPDATE topics SET updated_at = datetime('now') WHERE id = ?;

-- name: update
UPDATE topics
SET title = ?, body_html = ?, updated_at = datetime('now')
WHERE id = ?;

-- name: delete
DELETE FROM topics WHERE id = ?;

-- name: deleteStarsForTopic
DELETE FROM stars
WHERE (target_type = 'topic' AND target_id = ?)
   OR (target_type = 'post' AND target_id IN (SELECT id FROM posts WHERE topic_id = ?));
