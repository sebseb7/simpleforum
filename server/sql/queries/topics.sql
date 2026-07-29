-- name: listSlugs
SELECT slug FROM topics ORDER BY id ASC;

-- name: listBySection
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin,
  sec.title AS section_title,
  sec.slug AS section_slug,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.section_id = ?
ORDER BY t.is_pinned DESC, t.updated_at DESC, t.id DESC
LIMIT ? OFFSET ?;

-- name: countBySection
SELECT COUNT(*) AS n FROM topics WHERE section_id = ?;

-- name: listPinnedBySection
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin,
  sec.title AS section_title,
  sec.slug AS section_slug,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.section_id = ? AND t.is_pinned = 1
ORDER BY t.updated_at DESC, t.id DESC;

-- name: listTopStarredBySection
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin,
  sec.title AS section_title,
  sec.slug AS section_slug,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.section_id = ?
  AND t.is_pinned = 0
  AND (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) > 0
ORDER BY star_count DESC, t.updated_at DESC, t.id DESC
LIMIT ?;

-- name: findById
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.email AS author_email,
  u.is_admin AS author_is_admin,
  sec.title AS section_title,
  sec.slug AS section_slug,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.id = ?;

-- name: findBySlug
SELECT
  t.id, t.section_id, t.title, t.slug, t.body_html, t.author_id, t.is_closed, t.is_pinned, t.created_at, t.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.email AS author_email,
  u.is_admin AS author_is_admin,
  sec.title AS section_title,
  sec.slug AS section_slug,
  sec.admin_only_topics AS section_admin_only_topics,
  (SELECT COUNT(*) FROM posts p WHERE p.topic_id = t.id) AS post_count,
  (SELECT COUNT(*) FROM stars s WHERE s.target_type = 'topic' AND s.target_id = t.id) AS star_count
FROM topics t
JOIN users u ON u.id = t.author_id
JOIN sections sec ON sec.id = t.section_id
WHERE t.slug = ?;

-- name: slugExists
SELECT id FROM topics WHERE slug = ? AND id != ?;

-- name: insert
INSERT INTO topics (section_id, title, slug, body_html, author_id)
VALUES (?, ?, ?, ?, ?);

-- name: close
UPDATE topics SET is_closed = 1, updated_at = datetime('now') WHERE id = ?;

-- name: setPinned
UPDATE topics SET is_pinned = ?, updated_at = datetime('now') WHERE id = ?;

-- name: touch
UPDATE topics SET updated_at = datetime('now') WHERE id = ?;

-- name: update
UPDATE topics
SET title = ?, slug = ?, body_html = ?, updated_at = datetime('now')
WHERE id = ?;

-- name: delete
DELETE FROM topics WHERE id = ?;

-- name: deleteStarsForTopic
DELETE FROM stars
WHERE (target_type = 'topic' AND target_id = ?)
   OR (target_type = 'post' AND target_id IN (SELECT id FROM posts WHERE topic_id = ?));
