-- Up Migration
ALTER TABLE attachments
DROP CONSTRAINT attachments_type_check;

ALTER TABLE attachments
DROP CONSTRAINT attachments_owner_check;

ALTER TABLE attachments
ADD CONSTRAINT attachments_owner_check
    CHECK (
      (type = 'task' AND task_id IS NOT NULL AND sub_task_id IS NULL AND project_id IS NULL AND comment_id IS NULL) OR
      (type = 'sub-task' AND task_id IS NULL AND sub_task_id IS NOT NULL AND project_id IS NULL AND comment_id IS NULL) OR
      (type = 'project' AND task_id IS NULL AND sub_task_id IS NULL AND project_id IS NOT NULL AND comment_id IS NULL) OR
      (type = 'comment' AND task_id IS NULL AND sub_task_id IS NULL AND project_id IS NULL AND comment_id IS NOT NULL)
    );

ALTER TABLE attachments
ADD CONSTRAINT attachments_type_check CHECK (type IN ('task', 'sub-task', 'project', 'comment'));

-- Down Migration
ALTER TABLE attachments
DROP CONSTRAINT attachments_type_check;
ALTER TABLE attachments
DROP CONSTRAINT attachments_owner_check;

ALTER TABLE attachments
ADD CONSTRAINT attachments_type_check CHECK (type IN ('task', 'sub-task', 'project'));

ALTER TABLE attachments
ADD CONSTRAINT attachments_owner_check CHECK (
  (type = 'task' AND task_id IS NOT NULL AND sub_task_id IS NULL AND project_id IS NULL  ) OR
  (type = 'sub-task' AND task_id IS NULL AND sub_task_id IS NOT NULL AND project_id IS NULL ) OR
  (type = 'project' AND task_id IS NULL AND sub_task_id IS NULL AND project_id IS NOT NULL )
);
