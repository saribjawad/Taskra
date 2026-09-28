-- Up Migration
ALTER TABLE notifications
ADD COLUMN project_id UUID REFERENCES projects(id) DEFAULT NULL; 

-- Down Migration
ALTER TABLE notifications
DROP COLUMN project_id;