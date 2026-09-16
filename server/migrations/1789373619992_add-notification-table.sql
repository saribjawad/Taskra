-- Up Migration
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT CHECK(type IN ('task:completed', 'task:assigned', 'task:reporter_assigned', 'task:commented', 'task:due_soon')),
  message TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE notifications;
