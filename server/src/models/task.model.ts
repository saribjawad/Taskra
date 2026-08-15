export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'cancelled';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'no_priority';

export type TaskLabel = 'bug' | 'feature' | 'improvement';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  label: TaskLabel;
  assignee: string;
  creator: string;
  workspace_id: string;
  updated_at: Date;
  created_at: Date;
};
