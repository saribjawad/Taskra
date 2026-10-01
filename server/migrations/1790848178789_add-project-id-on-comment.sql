-- Up Migration
ALTER TABLE comments
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Down Migration
ALTER TABLE comments
DROP COLUMN project_id;