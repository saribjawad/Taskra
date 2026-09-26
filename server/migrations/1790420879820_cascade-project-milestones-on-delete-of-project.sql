-- Up Migration
ALTER TABLE project_milestones
DROP CONSTRAINT project_milestones_project_id_fkey;

ALTER TABLE project_milestones
ADD CONSTRAINT project_milestones_project_id_fkey
FOREIGN KEY(project_id)
REFERENCES projects(id)
ON DELETE CASCADE;

-- Down Migration
ALTER TABLE project_milestones
DROP CONSTRAINT project_milestones_project_id_fkey;

ALTER TABLE project_milestones
ADD CONSTRAINT project_milestones_project_id_fkey
FOREIGN KEY(project_id)
REFERENCES projects(id)
ON DELETE NO ACTION;