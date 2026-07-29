-- name: list
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
ORDER BY s.sort_order ASC, s.id ASC;

-- name: listByLang
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.lang = ?
ORDER BY s.sort_order ASC, s.id ASC;

-- name: findById
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.id = ?;

-- name: findBySlug
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.slug = ?;

-- name: slugExists
SELECT id FROM sections WHERE slug = ? AND id != ?;

-- name: insert
INSERT INTO sections (title, slug, description, lang, admin_only_topics, sort_order, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: update
UPDATE sections
SET title = ?, slug = ?, description = ?, lang = ?, admin_only_topics = ?, sort_order = ?
WHERE id = ?;
