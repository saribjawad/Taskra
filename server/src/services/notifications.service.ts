import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { Notification, NotificationType } from '../models/notifications.model';

export async function createNotificationNew(
  payload: {
    userId: string;
    workspaceId: string;
    type: NotificationType;
    message: string;
    metaData?: {
      actorId?: string;
      taskId?: string;
      projectId?: string;
    };
  },
  txClient?: PoolClient,
): Promise<Notification> {
  const { message, type, userId, workspaceId, metaData } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
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
  payload: {
    userId: string;
    workspaceId: string;
    type: NotificationType;
    message: string;
    metaData?: {
      actorId?: string;
      taskId?: string;
      projectId?: string;
    };
  },
  txClient?: PoolClient,
): Promise<Notification> {
  const { message, type, userId, workspaceId, metaData } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
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

/**
 * Get notification
 *
 * @param id - Notification uuid
 * @param workspaceId - Workspace uuid
 * @returns The notification
 */
export async function getNotification(
  notificationId: string,
  userId: string,
  workspaceId: string,
): Promise<Notification> {
  const result = await dbPool.query(
    `
    SELECT * FROM notifications
    WHERE id = $1 AND user_id = $2 AND workspace_id = $3
    `,
    [notificationId, userId, workspaceId],
  );

  return result.rows[0];
}

/**
 * Mark notification as seen
 *
 * @param id - Notification uuid
 * @returns Number of updated rows
 */
export async function markNotificationAsSeen(id: string) {
  const results = await dbPool.query(
    `
    UPDATE notifications
    SET seen = true
    WHERE id = $1
    `,
    [id],
  );

  return results.rowCount;
}

/** Mark every notification for this user in this workspace as seen. */
export async function markAllNotificationsAsSeen(
  userId: string,
  workspaceId: string,
): Promise<number> {
  const result = await dbPool.query(
    `
    UPDATE notifications
    SET seen = true
    WHERE user_id = $1 AND workspace_id = $2 AND seen = false
    `,
    [userId, workspaceId],
  );

  return result.rowCount ?? 0;
}

/**
 * Delete notification
 *
 * @param id - Notification uuid
 *
 * @returns Number of deleted rows
 */
export async function deleteNotification(id: string) {
  const results = await dbPool.query(
    `
    DELETE FROM notifications
    WHERE id = $1
    `,
    [id],
  );

  return results.rowCount;
}

/** Delete every notification for this user in this workspace. */
export async function deleteAllNotifications(
  userId: string,
  workspaceId: string,
): Promise<number> {
  const result = await dbPool.query(
    `
    DELETE FROM notifications
    WHERE user_id = $1 AND workspace_id = $2
    `,
    [userId, workspaceId],
  );

  return result.rowCount ?? 0;
}
