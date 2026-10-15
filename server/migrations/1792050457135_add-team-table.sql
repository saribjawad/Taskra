-- Up Migration
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name VARCHAR(24) NOT NULL,
  description TEXT DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE teams;
