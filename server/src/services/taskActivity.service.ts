import { dbPool } from '../db';
import {
  TaskActivityType,
  TaskActivityWithComments,
} from '../models/taskActivity.model';

/**
 * Create task activty in database
 *
 * @returns The created task activity
 */
export const createTaskActivity = async (
  taskId: string,
  userId: string,
  type: TaskActivityType,
  description: string,
  metadata: {
    field: string;
    from: string;
    to: string;
  } | null = null,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO task_activity (task_id, user_id, type, description, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [taskId, userId, type, description, metadata],
  );

  return result.rows[0];
};

/**
 * Get task activties by taskId in database
 *
 * @params taskId - Task UUID
 * @params limit - Limit of activity
 * @params cursorId - Cursor UUID
 * @params cursorDate - Cursor Date
 *
 * @returns Array of tasks activity
 */
export const getTaskActivitiesByTaskId = async (
  taskId: string,
  limit: number,
  cursorId?: string,
  cursorDate?: string,
): Promise<TaskActivityWithComments[]> => {
  // Return created_at as an ISO-8601 string (not a timestamp) so the pg driver doesn't
  // convert it to a JS Date, which would truncate microseconds and break cursor pagination.
  const result = await dbPool.query(
    `
    SELECT *, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor
     FROM 
     (
        SELECT
          c.id,
          c.task_id,
          c.user_id,
          u.username,
          c.content,
          null::text AS type,
          null::jsonb AS metadata,
          null::text AS description,
          'comment'::text AS activity_type,
          c.updated_at,
          c.created_at
        FROM comments AS c
        INNER JOIN users AS u ON u.id = c.user_id
     
        UNION ALL

      SELECT 
          a.id,
          a.task_id,
          a.user_id,
          u.username,
          null::text AS content,
          a.type,
          a.metadata,
          a.description,
          'activity'::text AS activity_type,
          null::timestamptz AS updated_at,
          a.created_at
        FROM task_activity AS a
        INNER JOIN users AS u ON u.id = a.user_id
     )
    WHERE task_id = $1
      AND (
            $2::timestamptz IS NULL
            OR (created_at, id) < ($2::timestamptz, $3::uuid)
          )
    ORDER BY created_at DESC, id DESC
    LIMIT $4
    `,
    [taskId, cursorDate ?? null, cursorId ?? null, limit],
  );

  return result.rows;
};
