-- Up Migration
CREATE TABLE sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(250) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TRIGGER update_sub_tasks_updated_at
BEFORE UPDATE ON sub_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

ALTER TABLE attachments
  ADD COLUMN type TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN sub_task_id UUID REFERENCES sub_tasks(id) ON DELETE CASCADE,
  ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE attachments
  ADD CONSTRAINT attachments_type_check
    CHECK (type IN ('task', 'sub-task', 'project')),
  ADD CONSTRAINT attachments_owner_check
    CHECK (
      (type = 'task' AND task_id IS NOT NULL AND sub_task_id IS NULL AND project_id IS NULL) OR
      (type = 'sub-task' AND task_id IS NULL AND sub_task_id IS NOT NULL AND project_id IS NULL) OR
      (type = 'project' AND task_id IS NULL AND sub_task_id IS NULL AND project_id IS NOT NULL)
    );

-- Down Migration
DELETE FROM attachments WHERE type <> 'task';
ALTER TABLE attachments
  DROP CONSTRAINT attachments_owner_check,
  DROP CONSTRAINT attachments_type_check,
  DROP COLUMN project_id,
  DROP COLUMN sub_task_id,
  DROP COLUMN type,
  ALTER COLUMN task_id SET NOT NULL;
DROP TABLE sub_tasks;
