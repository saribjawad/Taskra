-- Up Migration
ALTER TABLE workspace_members 
ADD COLUMN joined_at TIMESTAMP NOT NULL DEFAULT current_timestamp;

-- Down Migration
ALTER TABLE workspace_members
DROP COLUMN joined_at;
