-- Up Migration
ALTER TABLE task_activity
ALTER COLUMN created_at TYPE TIMESTAMPTZ;

-- Down Migration
ALTER TABLE task_activity
ALTER COLUMN created_at TYPE TIMESTAMP;