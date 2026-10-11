import { NotificationType } from '../models/notifications.model';

export interface NotificationPayloadType {
  type: NotificationType;
  message: string;
  metaData?: {
    taskId?: string;
    actorId?: string;
    projectId?: string;
  };
}

export type NewConversationPayload = {
  type: 'conversation:new';
  payload: {
    conversationId: string;
  };
};

export type SendMessagePayloadType = {
  type: 'message:send';
  payload: {
    conversationId: string;
    message: string;
  };
};

export type WebsocketMessagePayload =
  | NewConversationPayload
  | SendMessagePayloadType;
