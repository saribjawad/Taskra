export type TaskActivityType =
  | 'task_created'
  | 'status_changed'
  | 'priority_changed'
  | 'title_changed'
  | 'assignee_changed'
  | 'reporter_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'task_completed'
  | 'task_connected_to_project'
  | 'task_connected_to_milestone'
  | 'task_removed_from_project';

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  type: TaskActivityType;
  metadata: {
    field: string;
    from: string;
    to: string;
  };
  description: string;
  created_at: Date;
}

export interface TaskActivityWithComments {
  id: string;
  task_id: string;
  user_id: string;
  username: string;
  content: string | null;
  type: TaskActivityType | null;
  metadata: { field: string; from: string; to: string } | null;
  description: string | null;
  activity_type: 'comment' | 'activity';
  updated_at: Date | null;
  created_at: Date;
  created_at_cursor: '2026-09-26T10:24:30.655987Z';
}
