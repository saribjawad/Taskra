-- Up Migration
ALTER TABLE conversations
ADD COLUMN workspace_id UUID NOT NULL REFERENCES workspace(id);

-- Down Migration
ALTER TABLE conversations
DROP COLUMN workspace_id;
