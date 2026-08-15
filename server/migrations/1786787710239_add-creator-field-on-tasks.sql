-- Up Migration
ALTER TABLE tasks
ADD COLUMN creator UUID NOT NULL REFERENCES users(id);

-- Down Migration
ALTER TABLE tasks
DROP COLUMN creator;