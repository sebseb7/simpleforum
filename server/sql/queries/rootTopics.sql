-- name: findByLang
-- api: GET /settings ; GET /sections (resolveWelcomeTopic) ; SSG loadPageData (/)
-- params: lang
SELECT
  r.lang, r.title, r.body_html, r.author_id, r.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin
FROM root_topics r
LEFT JOIN users u ON u.id = r.author_id
WHERE r.lang = ?;

-- name: list
-- api: (unused helper)
-- params: (none)
SELECT
  r.lang, r.title, r.body_html, r.author_id, r.updated_at,
  u.name AS author_name,
  CASE WHEN u.hide_avatar = 1 THEN NULL ELSE u.picture END AS author_picture,
  u.is_admin AS author_is_admin
FROM root_topics r
LEFT JOIN users u ON u.id = r.author_id
ORDER BY r.lang ASC;

-- name: upsert
-- api: PATCH /settings
-- params: lang, title, body_html, author_id
INSERT INTO root_topics (lang, title, body_html, author_id, updated_at)
VALUES (?, ?, ?, ?, datetime('now'))
ON CONFLICT(lang) DO UPDATE SET
  title = excluded.title,
  body_html = excluded.body_html,
  author_id = excluded.author_id,
  updated_at = datetime('now');
