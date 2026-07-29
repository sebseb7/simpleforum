-- name: listByTopic
SELECT
  p.id, p.topic_id, p.body_html, p.author_id, p.created_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'post' AND s.target_id = p.id) AS star_count
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.topic_id = ?
ORDER BY p.created_at ASC, p.id ASC;

-- name: findById
SELECT
  p.id, p.topic_id, p.body_html, p.author_id, p.created_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'post' AND s.target_id = p.id) AS star_count
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.id = ?;

-- name: insert
INSERT INTO posts (topic_id, body_html, author_id)
VALUES (?, ?, ?);

-- name: update
UPDATE posts SET body_html = ? WHERE id = ?;

-- name: delete
DELETE FROM posts WHERE id = ?;

-- name: deleteStars
DELETE FROM stars WHERE target_type = 'post' AND target_id = ?;
