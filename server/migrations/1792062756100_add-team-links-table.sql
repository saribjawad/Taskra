-- Up Migration
CREATE TABLE team_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  title VARCHAR(24) NOT NULL,
  url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE team_links;
