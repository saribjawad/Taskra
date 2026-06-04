import { dbPool } from '../db';

/**
 * Find comment by ID in database
 *
 * @param id - comment uuid
 * @returns The task row if found, otherwise undefined
 */
export const findCommentById = async (id: string) => {
  const result = await dbPool.query(
    `
    SELECT * FROM comments WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
};

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

/**
 * Update comment in database
 *
 * @param id - Task ID
 * @param content - Comment content
 * @returns Count of updated row
 */
export const updateComment = async (id: string, content: string) => {
  const result = await dbPool.query(
    `
    UPDATE comments
    SET content = $2
    WHERE id = $1
    `,
    [id, content],
  );

  return result.rowCount;
};

/**
 * Delete comment in database
 *
 * @param id - Task ID
 * @returns Number of deleted rows
 */
export const deleteComment = async (id: string) => {
  const result = await dbPool.query(
    `
    DELETE FROM comments
    WHERE id = $1 `,
    [id],
  );

  return result.rowCount;
};
