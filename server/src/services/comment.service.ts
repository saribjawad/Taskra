import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { Comment, CommentWithAuthor } from '../models/comment.model';

/**
 * Find comments by task ID in database
 *
 * @param id - taskk uuid
 * @returns The task row if found, otherwise undefined
 */
export const findCommentsByTaskId = async (
  id: string,
): Promise<CommentWithAuthor[]> => {
  const result = await dbPool.query(
    `
    SELECT
      c.id, c.content, c.updated_at, c.created_at, u.id AS user_id, u.username
    FROM comments AS c
    INNER JOIN users AS u ON c.user_id = u.id
    WHERE task_id = $1
    ORDER BY c.created_at
    `,
    [id],
  );

  return result.rows;
};

/**
 * Find comment by ID in database
 *
 * @param id - comment uuid
 * @returns The task row if found, otherwise undefined
 */
export const findCommentByIdAndTaskId = async (
  id: string,
  taskId: string,
): Promise<Comment> => {
  const result = await dbPool.query(
    `
    SELECT * FROM comments WHERE id = $1 AND task_id = $2
    `,
    [id, taskId],
  );

  return result.rows[0];
};

/**
 * Create comment in database
 *
 * @param taskId - Task uuid
 * @param userId - User uuid
 * @param content - Comment content
 * @returns The created comment
 */
export const createComment = async (
  payload: {
    taskId: string;
    userId: string;
    content: string;
    workspace_id: string;
  },
  txClient?: PoolClient,
): Promise<Comment> => {
  const { content, taskId, userId, workspace_id } = payload;
  const db = txClient || dbPool;

  const result = await db.query(
    `
    INSERT INTO comments (task_id, user_id, content, workspace_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
     `,
    [taskId, userId, content, workspace_id],
  );

  return result.rows[0];
};

/** Create a comment attached to a project.
 *
 * @params projectId - UUID of the project
 * @params userId - UUID of the commenter
 * @params content - Comment content
 *
 * @returns Created comment
 */
export const createProjectComment = async (
  projectId: string,
  userId: string,
  content: string,
): Promise<Comment> => {
  const result = await dbPool.query(
    `
    INSERT INTO comments (project_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [projectId, userId, content],
  );

  return result.rows[0];
};

/** Find one comment only when it belongs to the requested project.
 *
 * @params commentId - UUID of the comment
 * @params projectId - UUID of the project
 *
 * @returns Created comment
 */
export const findProjectCommentById = async (
  commentId: string,
  projectId: string,
): Promise<Comment> => {
  const result = await dbPool.query(
    `
    SELECT * FROM comments
    WHERE id = $1 AND project_id = $2
    `,
    [commentId, projectId],
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

/** Update a project comment without allowing it to be moved to another project.
 *
 * @params commentId - UUID of the comment
 * @params projectId - UUID of the project
 * @params content - Comment content
 *
 * @returns Number of updated rows
 */
export const updateProjectComment = async (
  commentId: string,
  projectId: string,
  content: string,
) => {
  const result = await dbPool.query(
    `
    UPDATE comments
    SET content = $3
    WHERE id = $1 AND project_id = $2
    `,
    [commentId, projectId, content],
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

/** Delete a project comment only within its project.
 *
 * @param commentId - Comment ID
 * @param projectId - Project ID
 *
 * @returns Number of deleted rows
 */
export const deleteProjectComment = async (
  commentId: string,
  projectId: string,
) => {
  const result = await dbPool.query(
    `
    DELETE FROM comments
    WHERE id = $1 AND project_id = $2
    `,
    [commentId, projectId],
  );

  return result.rowCount;
};
