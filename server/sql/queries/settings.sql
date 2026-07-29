-- name: get
-- api: GET /settings ; GET /sections (getSiteName) ; SSG loadPageData (siteLabel)
-- params: key
SELECT key, value FROM site_settings WHERE key = ?;

-- name: list
-- api: (unused helper)
-- params: (none)
SELECT key, value FROM site_settings;

-- name: upsert
-- api: PATCH /settings
-- params: key, value
INSERT INTO site_settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
