import { dbPool } from '../db';
import { Notification, NotificationType } from '../models/notifications.model';

/**
 * Create notifications in database
 *
 * @param userId - User uuid
 * @param workspaceId - Workspace uuid
 * @param type - Type of notifications
 * @param message - Notification message
 * @param metaData.actorId - Actor uuid (optional)
 * @param metaData.taskId - Task uuid (optional)
 * @param metaData.projectId - Project uuid (optional)
 * @returns The created notifications
 */
export async function createNotification(
  userId: string,
  workspaceId: string,
  type: NotificationType,
  message: string,
  metaData?: {
    actorId?: string;
    taskId?: string;
    projectId?: string;
  },
): Promise<Notification> {
  const result = await dbPool.query(
    `
    INSERT INTO notifications
    (user_id, actor_id, task_id, project_id, workspace_id, type, message)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      userId,
      metaData?.actorId ?? null,
      metaData?.taskId ?? null,
      metaData?.projectId ?? null,
      workspaceId,
      type,
      message,
    ],
  );

  return result.rows[0];
}

/**
 * Get notifications by userId
 *
 * @param userId - User uuid
 * @param workspace - Workspace uuid
 * @param cursorTime - Created at of last fetched notification
 * @param cursorId - Last fetched notification UUID
 * @param limit - Number of limit to fetch
 *
 * @returns Array of notifications
 */
export async function getNotificationsByUserAndWorkspaceId(
  userId: string,
  workspaceId: string,
  cursorTime: string | undefined,
  cursorId: string | undefined,
  limit: number,
): Promise<Notification[]> {
  const result = await dbPool.query(
    `
    SELECT * FROM notifications
    WHERE user_id = $1 AND workspace_id = $2
    AND (
          $3::timestamptz IS NULL 
          OR (created_at, id) < ($3::timestamptz, $4::uuid)
        )
    ORDER BY created_at DESC, id DESC
    LIMIT $5;
    `,
    [userId, workspaceId, cursorTime ?? null, cursorId ?? null, limit],
  );

  return result.rows;
}
