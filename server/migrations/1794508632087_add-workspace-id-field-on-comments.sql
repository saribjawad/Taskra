-- Up Migration
ALTER TABLE comments ADD COLUMN workspace_id UUID REFERENCES workspace(id) ON DELETE CASCADE;

-- Down Migration
ALTER TABLE comments DROP COLUMN workspace_id;
