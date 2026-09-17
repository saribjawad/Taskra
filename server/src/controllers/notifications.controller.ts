import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { getNotificationsByUserId } from '../services/notifications.service';
import { NotificationIdParamsSchema } from '../schemas/notifications.schema';

export const GetUserNotifications = async (req: Request, res: Response) => {
  const LIMIT = 10;

  const user = req.user;
  const { cursorTime, cursorId } = req.query;

  const notifications = await getNotificationsByUserId(
    user.id,
    cursorTime as string,
    cursorId as string,
    LIMIT + 1,
  );

  const hasMore = notifications.length > LIMIT;

  // Remove extra if exist
  const pageNotifications = hasMore
    ? notifications.slice(0, LIMIT)
    : notifications;

  // Cursor data for client
  const cursor = hasMore
    ? {
        time: pageNotifications[pageNotifications.length - 1].created_at,
        id: pageNotifications[pageNotifications.length - 1].id,
      }
    : null;

  // Format from snake_case to camelCase
  const formatedNotifications = pageNotifications.map((n) => ({
    id: n.id,
    userId: n.user_id,
    actorId: n.actor_id,
    taskId: n.task_id,
    workspaceId: n.workspace_id,
    seen: n.seen,
    type: n.type,
    message: n.message,
    updatedAt: n.updated_at,
    createdAt: n.created_at,
  }));

  res.status(200).json(
    new ApiResponse(200, 'Users notifications', {
      notifications: formatedNotifications,
      hasMore,
      cursor,
    }),
  );
};

export const MarkNotificationAsSeen = async (req: Request, res: Response) => {
  const { notificationId } = NotificationIdParamsSchema.parse(req.params);

  console.log(notificationId);

  res.status(200).json(new ApiResponse(200, 'Notification marked as seen'));
};
