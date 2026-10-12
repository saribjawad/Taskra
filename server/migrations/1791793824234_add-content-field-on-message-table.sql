-- Up Migration
ALTER TABLE messages
ADD COLUMN content TEXT NOT NULL;

-- Down Migration
ALTER TABLE messages
DROP COLUMN content;
