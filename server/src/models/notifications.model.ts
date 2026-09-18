export type NotificationType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon'
  | 'invite:accepted'
  | 'invite:declined';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  task_id?: string;
  workspace_id: string;
  seen: boolean;
  type: NotificationType;
  message: string;
  updated_at: Date;
  created_at: Date;
}
