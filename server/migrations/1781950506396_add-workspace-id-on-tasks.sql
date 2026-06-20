-- Up Migration
ALTER TABLE TASKS
ADD COLUMN workspace_id UUID references workspace(id) NOT NULL;

-- Down Migration
ALTER TABLE TASKS
DROP COLUMN workspace_id;
