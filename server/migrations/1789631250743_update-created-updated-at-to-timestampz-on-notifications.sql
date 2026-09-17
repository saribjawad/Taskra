-- Up Migration
ALTER TABLE notifications
ALTER COLUMN created_at TYPE TIMESTAMPTZ;

-- Down Migration
ALTER TABLE notifications
ALTER COLUMN created_at TYPE TIMESTAMP;