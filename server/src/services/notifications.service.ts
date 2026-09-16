import { dbPool } from '../db';
import { NotificationType } from '../models/notifications.model';

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
) {
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
