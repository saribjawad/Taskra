-- Up Migration
ALTER TABLE messages
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp;

-- Down Migration
ALTER TABLE messages
DROP COLUMN updated_at;
