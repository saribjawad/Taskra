-- Up Migration
ALTER TABLE tasks
ADD COLUMN reporter UUID REFERENCES users(id) ON DELETE SET NULL;

-- Down Migration
ALTER TABLE tasks
DROP COLUMN reporter;