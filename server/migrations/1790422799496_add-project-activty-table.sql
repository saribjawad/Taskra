-- Up Migration
CREATE TABLE project_activty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'project_created',
      'lead_updated',
      'member_added',
      'member_removed',
      'priority_updated',
      'status_updated',
      'start_date_updated',
      'end_date_updated',
      'milestone_added',
      'milestone_removed',
      'milestone_updated'
    )
  ),
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE project_activity;