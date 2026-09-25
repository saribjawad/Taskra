-- Up Migration
ALTER TABLE tasks
ALTER COLUMN created_at TYPE TIMESTAMPTZ;

-- Down Migration
ALTER TABLE tasks
ALTER COLUMN created_at TYPE TIMESTAMP;
