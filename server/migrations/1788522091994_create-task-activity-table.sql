-- Up Migration
CREATE TABLE task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) on DELETE CASCADE,
  user_id UUID REFERENCES users(id) on DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'task_created',
      'status_changed',
      'priority_changed',
      'title_changed',
      'assignee_changed',
      'reporter_changed',
      'comment_added',
      'attachment_added',
      'task_completed'
    )
  ),
  metadata JSONB,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE task_activity;