-- Up Migration
ALTER TABLE users
ADD COLUMN active_workspace UUID REFERENCES workspace(id)
ON DELETE SET NULL DEFAULT NULL;

-- Down Migration
ALTER TABLE users
DROP COLUMN active_workspace;
