-- name: findByGoogleSub
SELECT id, google_sub, email, name, picture, hide_avatar, is_admin, created_at
FROM users WHERE google_sub = ?;

-- name: findById
SELECT id, google_sub, email, name, picture, hide_avatar, is_admin, created_at
FROM users WHERE id = ?;

-- name: insert
INSERT INTO users (google_sub, email, name, picture, hide_avatar, is_admin)
VALUES (?, ?, ?, ?, 0, ?);

-- name: updateLogin
UPDATE users SET email = ?, picture = ?, is_admin = ? WHERE id = ?;

-- name: updateSettings
UPDATE users SET name = ?, hide_avatar = ? WHERE id = ?;

-- name: listTopicIdsByAuthor
SELECT id FROM topics WHERE author_id = ?;

-- name: listPostIdsByAuthor
SELECT id FROM posts WHERE author_id = ?;

-- name: clearSectionCreator
UPDATE sections SET created_by = NULL WHERE created_by = ?;

-- name: deleteStarsByUser
DELETE FROM stars WHERE user_id = ?;

-- name: deleteStarsForPost
DELETE FROM stars WHERE target_type = 'post' AND target_id = ?;

-- name: delete
DELETE FROM users WHERE id = ?;
