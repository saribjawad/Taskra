import { NotificationType } from '../models/notifications.model';

export interface NotificationPayloadType {
  type: NotificationType;
  message: string;
  metaData?: {
    taskId?: string;
    actorId?: string;
  };
}
