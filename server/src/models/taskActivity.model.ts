export type TaskActivityType =
  | 'task_created'
  | 'status_changed'
  | 'priority_changed'
  | 'title_changed'
  | 'assignee_changed'
  | 'reporter_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'task_completed';

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
