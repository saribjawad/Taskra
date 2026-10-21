-- Up Migration
ALTER TABLE tasks
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE projects
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Down Migration
ALTER TABLE tasks
DROP COLUMN team_id;

ALTER TABLE projects
DROP COLUMN team_id;
