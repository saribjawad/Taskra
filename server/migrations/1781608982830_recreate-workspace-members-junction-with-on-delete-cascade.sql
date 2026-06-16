-- Up Migration
DROP TABLE workspace_members;
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);


-- Down Migration
DROP TABLE workspace_members;
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspace(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
