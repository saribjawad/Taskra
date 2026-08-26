-- Up Migration
ALTER TABLE workspace_members
ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
CHECK(role IN ('member', 'viewer', 'admin', 'owner'));

-- Down Migration
ALTER TABLE workspace_members
DROP COLUMN role;