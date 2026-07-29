-- name: list
SELECT
  s.id, s.title, s.description, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
ORDER BY s.sort_order ASC, s.id ASC;

-- name: findById
SELECT
  s.id, s.title, s.description, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.id = ?;

-- name: insert
INSERT INTO sections (title, description, admin_only_topics, sort_order, created_by)
VALUES (?, ?, ?, ?, ?);

-- name: update
UPDATE sections
SET title = ?, description = ?, admin_only_topics = ?, sort_order = ?
WHERE id = ?;
