-- Up Migration
ALTER TABLE project_members
DROP CONSTRAINT project_members_project_id_fkey;

ALTER TABLE project_members
ADD CONSTRAINT project_members_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE CASCADE;

-- Down Migration
ALTER TABLE project_members
DROP CONSTRAINT project_members_project_id_fkey;

ALTER TABLE project_members
ADD CONSTRAINT project_members_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE NO ACTION;
