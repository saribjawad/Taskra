-- Up Migration
ALTER TABLE tasks
DROP COLUMN created_by,
ADD COLUMN creator UUID REFERENCES users(id) ON DELETE SET NULL;

-- Down Migration
ALTER TABLE tasks
DROP COLUMN creator,
ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;