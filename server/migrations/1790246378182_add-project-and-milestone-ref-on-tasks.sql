-- Up Migration
ALTER TABLE tasks
ADD COLUMN project_id UUID REFERENCES projects(id) DEFAULT NULL,
ADD COLUMN project_milestone_id UUID REFERENCES project_milestones(id) DEFAULT NULL;

-- Down Migration
ALTER TABLE tasks
DROP COLUMN project_id,
DROP COLUMN project_milestone_id;
