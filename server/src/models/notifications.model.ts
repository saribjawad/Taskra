export type NotificationType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  task_id?: string;
  workspace_id: string;
  seen: boolean;
  type: NotificationType;
}
