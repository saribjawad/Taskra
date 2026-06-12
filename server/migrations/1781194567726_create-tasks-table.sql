-- Up Migration
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(250) NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL CHECK(priority IN ('urgent', 'high', 'medium', 'low', 'no_priority')),
  label TEXT CHECK(label IN ('bug', 'feature', 'improvemnt')),
  assignee UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE IF EXISTS tasks;
