-- name: findByGoogleSub
-- api: POST /google ; POST /test-login
-- params: google_sub
SELECT id, google_sub, email, name, picture, hide_avatar, is_admin, created_at
FROM users WHERE google_sub = ?;

-- name: findById
-- api: GET/PATCH/DELETE /me ; POST /google ; POST /test-login ; scripts/toggle-admin
-- params: id
SELECT id, google_sub, email, name, picture, hide_avatar, is_admin, created_at
FROM users WHERE id = ?;

-- name: insert
-- api: POST /google ; POST /test-login
-- params: google_sub, email, name, picture, is_admin
INSERT INTO users (google_sub, email, name, picture, hide_avatar, is_admin)
VALUES (?, ?, ?, ?, 0, ?);

-- name: updateLogin
-- api: POST /google ; POST /test-login
-- params: email, picture, id
UPDATE users SET email = ?, picture = ? WHERE id = ?;

-- name: updateAdmin
-- api: POST /test-login ; scripts/toggle-admin
-- params: is_admin, id
UPDATE users SET is_admin = ? WHERE id = ?;

-- name: listAll
-- api: scripts/toggle-admin
-- params: (none)
SELECT id, google_sub, email, name, picture, hide_avatar, is_admin, created_at
FROM users
ORDER BY id ASC;

-- name: updateSettings
-- api: PATCH /me ; POST /test-login
-- params: name, hide_avatar, id
UPDATE users SET name = ?, hide_avatar = ? WHERE id = ?;

-- name: listTopicIdsByAuthor
-- api: DELETE /me
-- params: author_id
SELECT id FROM topics WHERE author_id = ?;

-- name: listPostIdsByAuthor
-- api: DELETE /me
-- params: author_id
SELECT id FROM posts WHERE author_id = ?;

-- name: clearSectionCreator
-- api: DELETE /me
-- params: created_by (user_id)
UPDATE sections SET created_by = NULL WHERE created_by = ?;

-- name: deleteStarsByUser
-- api: DELETE /me
-- params: user_id
DELETE FROM stars WHERE user_id = ?;

-- name: deleteStarsForPost
-- api: DELETE /me
-- params: post_id (target_id)
DELETE FROM stars WHERE target_type = 'post' AND target_id = ?;

-- name: delete
-- api: DELETE /me
-- params: id
DELETE FROM users WHERE id = ?;
