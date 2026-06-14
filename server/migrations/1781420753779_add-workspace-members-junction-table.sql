-- Up Migration
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Down Migration
DROP TABLE IF EXISTS workspace_members;
