import { dbPool } from '../db';

/**
 * Create comment in database
 *
 * @param taskId - Task uuid
 * @param userId - User uuid
 * @param content - Comment content
 * @returns The task row if found, otherwise undefined
 */
export const createComment = async (
  taskId: string,
  userId: string,
  content: string,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO comments (task_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING *
     `,
    [taskId, userId, content],
  );

  return result.rows[0];
};
