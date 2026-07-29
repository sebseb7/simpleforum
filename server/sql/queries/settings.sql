-- name: get
SELECT key, value FROM site_settings WHERE key = ?;

-- name: list
SELECT key, value FROM site_settings;

-- name: upsert
INSERT INTO site_settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
