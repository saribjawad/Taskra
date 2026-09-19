-- Up Migration
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_summary VARCHAR(255),
  descriptoin TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('urgent', 'high', 'medium', 'low', 'no_priority')),
  status TEXT NOT NULL CHECK(status IN ('backlog', 'planned', 'in_progress', 'completed', 'cancelled')),
  lead UUID REFERENCES users(id) DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  target_date DATE DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Down Migration
DROP TABLE projects;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;