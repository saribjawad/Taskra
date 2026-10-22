-- Up Migration
ALTER TABLE team_documents
ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE team_links
ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Down Migration
ALTER TABLE team_documents DROP COLUMN created_by;
ALTER TABLE team_links DROP COLUMN created_by;
