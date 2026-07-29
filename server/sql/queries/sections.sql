-- name: listSlugs
-- api: SSG listPrerenderPaths
-- params: (none)
SELECT slug FROM sections ORDER BY sort_order ASC, id ASC;

-- name: list
-- api: GET /sections?all=1 ; scripts/seed-stress
-- params: (none)
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
ORDER BY s.sort_order ASC, s.id ASC;

-- name: listByLang
-- api: GET /sections?lang= ; SSG loadPageData (/)
-- params: lang
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.lang = ?
ORDER BY s.sort_order ASC, s.id ASC;

-- name: findById
-- api: POST /sections ; PATCH /sections/:id ; findSection (numeric id)
-- params: id
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.id = ?;

-- name: findBySlug
-- api: GET /sections/:idOrSlug/topics ; POST /sections/:idOrSlug/topics ; SSG loadPageData (/section/:slug)
-- params: slug
SELECT
  s.id, s.title, s.slug, s.description, s.lang, s.admin_only_topics, s.sort_order, s.created_by, s.created_at,
  (SELECT COUNT(*) FROM topics t WHERE t.section_id = s.id) AS topic_count
FROM sections s
WHERE s.slug = ?;

-- name: slugExists
-- api: POST /sections ; PATCH /sections/:id (allocateSectionSlug)
-- params: slug, exclude_id
SELECT id FROM sections WHERE slug = ? AND id != ?;

-- name: insert
-- api: POST /sections
-- params: title, slug, description, lang, admin_only_topics, sort_order, created_by
INSERT INTO sections (title, slug, description, lang, admin_only_topics, sort_order, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: update
-- api: PATCH /sections/:id
-- params: title, slug, description, lang, admin_only_topics, sort_order, id
UPDATE sections
SET title = ?, slug = ?, description = ?, lang = ?, admin_only_topics = ?, sort_order = ?
WHERE id = ?;
