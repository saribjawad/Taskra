export type NotificationType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon';

export interface NotificationPayloadType {
  type: NotificationType;
  message: string;
  metaData?: {
    taskId?: string;
    actorId?: string;
  };
}
