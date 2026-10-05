import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  deleteNotification,
  deleteAllNotifications,
  getNotification,
  getNotificationsByUserAndWorkspaceId,
  markAllNotificationsAsSeen,
  markNotificationAsSeen,
} from '../services/notifications.service';
import { NotificationIdParamsSchema } from '../schemas/notifications.schema';
import { ApiError } from '../utils/ApiErrors';

export const GetUserNotifications = async (req: Request, res: Response) => {
  const LIMIT = 10;

  const user = req.user;
  const { cursorTime, cursorId } = req.query;

  const notifications = await getNotificationsByUserAndWorkspaceId(
    user.id,
    user.activeWorkspace,
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
    projectId: n.project_id,
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
  const user = req.user;
  const { notificationId } = NotificationIdParamsSchema.parse(req.params);

  const notification = await getNotification(
    notificationId,
    user.id,
    user.activeWorkspace,
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  const noOfUpdatedRows = await markNotificationAsSeen(notification.id);

  if (!noOfUpdatedRows || noOfUpdatedRows <= 0) {
    throw ApiError.internal(
      'Something went wrong while marking notification as seen',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Notification marked as seen'));
};

export const MarkAllNotificationsAsSeen = async (
  req: Request,
  res: Response,
) => {
  const { id: userId, activeWorkspace: workspaceId } = req.user;
  const updatedCount = await markAllNotificationsAsSeen(userId, workspaceId);

  res.status(200).json(
    new ApiResponse(200, 'All notifications marked as seen', {
      updatedCount,
    }),
  );
};

export const DeleteNotification = async (req: Request, res: Response) => {
  const user = req.user;
  const { notificationId } = NotificationIdParamsSchema.parse(req.params);

  const notification = await getNotification(
    notificationId,
    user.id,
    user.activeWorkspace,
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  const deletedRowCount = await deleteNotification(notification.id);

  if (!deletedRowCount || deletedRowCount <= 0) {
    throw ApiError.internal('Someting went wrong while deleting notification');
  }

  res.status(200).json(new ApiResponse(200, 'Notification deleted'));
};

export const DeleteAllNotifications = async (req: Request, res: Response) => {
  const { id: userId, activeWorkspace: workspaceId } = req.user;
  const deletedCount = await deleteAllNotifications(userId, workspaceId);

  res
    .status(200)
    .json(new ApiResponse(200, 'All notifications deleted', { deletedCount }));
};
