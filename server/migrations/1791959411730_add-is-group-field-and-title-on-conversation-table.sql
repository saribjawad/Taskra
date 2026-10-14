-- Up Migration
ALTER TABLE conversations
ADD COLUMN is_group BOOL NOT NULL DEFAULT FALSE,
ADD COLUMN title VARCHAR(24) DEFAULT NULL;

-- Down Migration
ALTER TABLE conversations
DROP COLUMN is_group,
DROP COLUMN title;
