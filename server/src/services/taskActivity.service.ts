import { dbPool } from '../db';
import { TaskActivity, TaskActivityType } from '../models/taskActivity.model';

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
 * @returns Array of tasks activity
 */
export const getTaskActivitiesByTaskId = async (
  taskId: string,
): Promise<TaskActivity[]> => {
  const result = await dbPool.query(
    `
    SELECT * FROM task_activity
    WHERE task_id = $1;
    `,
    [taskId],
  );

  return result.rows;
};
