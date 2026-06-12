-- Up Migration
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE IF EXISTS comments;
