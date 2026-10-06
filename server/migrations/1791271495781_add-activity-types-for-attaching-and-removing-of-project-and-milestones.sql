-- Up Migration
ALTER TABLE task_activity
DROP CONSTRAINT task_activity_type_check;

ALTER table task_activity
ADD CONSTRAINT task_activity_type_check CHECK (type IN ('task_created', 'status_changed', 'priority_changed', 'title_changed', 'assignee_changed', 'reporter_changed', 'comment_added', 'attachment_added', 'task_completed', 'task_connected_to_project', 'task_connected_to_milestone', 'task_removed_from_project' ));

-- Down Migration
ALTER TABLE task_activity
DROP CONSTRAINT task_activity_type_check;

ALTER table task_activity
ADD CONSTRAINT task_activity_type_check CHECK (type IN ('task_created', 'status_changed', 'priority_changed', 'title_changed', 'assignee_changed', 'reporter_changed', 'comment_added', 'attachment_added', 'task_completed' ));