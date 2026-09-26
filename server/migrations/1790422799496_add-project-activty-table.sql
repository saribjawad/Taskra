-- Up Migration
CREATE TABLE project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'project_created',
      'project_updated',
      'lead_changed',
      'member_added',
      'member_removed',
      'priority_changed',
      'status_changed',
      'start_date_changed',
      'end_date_changed',
      'milestone_added',
      'milestone_removed',
      'milestone_changed'
    )
  ),
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE project_activity;