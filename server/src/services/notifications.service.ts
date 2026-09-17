import { dbPool } from '../db';
import { Notification, NotificationType } from '../models/notifications.model';

/**
 * Create notifications in database
 *
 * @param userId - User uuid
 * @param workspaceId - Workspace uuid
 * @param type - Type of notifications
 * @param message - Notification message
 * @param actorId - Actor uuid (optional)
 * @param taskId - Task uuid (optional)
 * @returns The created notifications
 */
export async function createNotification(
  userId: string,
  workspaceId: string,
  type: NotificationType,
  message: string,
  actorId?: string,
  taskId?: string,
): Promise<Notification> {
  const result = await dbPool.query(
    `
    INSERT INTO notifications
    (user_id, actor_id, task_id, workspace_id, type, message)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [userId, actorId ?? null, taskId ?? null, workspaceId, type, message],
  );

  return result.rows[0];
}

/**
 * Get notifications by userId
 *
 * @param userId - User uuid
 * @returns Array of notifications
 */
export async function getNotificationsByUserId(
  userId: string,
  cursorTime: string | undefined,
  cursorId: string | undefined,
  limit: number,
): Promise<Notification[]> {
  console.log({
    userId,
    cursorTime,
    cursorId,
  });

  const result = await dbPool.query(
    `
    SELECT * FROM notifications
    WHERE user_id = $1
    AND (
          $2::timestamptz IS NULL 
          OR (created_at, id) < ($2::timestamptz, $3::uuid)
        )
    ORDER BY created_at DESC, id DESC
    LIMIT $4;
    `,
    [userId, cursorTime ?? null, cursorId ?? null, limit],
  );

  return result.rows;
}
