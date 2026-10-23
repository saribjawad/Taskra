-- Up Migration
ALTER TABLE sub_tasks
  DROP COLUMN is_completed,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'no_priority'
    CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'no_priority')),
  ADD COLUMN label TEXT
    CHECK (label IN ('bug', 'feature', 'improvement'));

-- Down Migration
ALTER TABLE sub_tasks
  DROP COLUMN label,
  DROP COLUMN priority,
  DROP COLUMN status,
  ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT FALSE;
