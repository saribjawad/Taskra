import { dbPool } from '../db';
import { Label, Priority, Status, UpdateSchema } from '../schemas/task.schema';

/**
 * Find task by ID in database
 *
 * @param id - Task uuid
 * @returns The task row if found, otherwise undefined
 */
export const findTaskById = async (id: string) => {
  const result = await dbPool.query(
    `
    SELECT * FROM tasks WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
};

/**
 * Create task in database
 *
 * @param title - Task title
 * @param description - Task description
 * @param status - Task status
 * @param priority - Task priority
 * @param label - Task label
 * @param assignee - Task assignee
 * @returns The task row if found, otherwise undefined
 */
export const createTask = async (
  title: string,
  description: string,
  status: string,
  priority: string,
  label: string,
  assignee: string,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO tasks(title, description, status, priority, label, assignee)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [title, description, status, priority, label, assignee],
  );

  return result.rows[0];
};

/**
 * Update task in database
 *
 * @param id - Task ID
 * @param data - Object containing the fields to upgrade
 * @param data.title - Task title (optional)
 * @param description - Task description (optional)
 * @param status - Task status (optional)
 * @param priority - Task priority (optional)
 * @param label - Task label (optional)
 * @param assignee - Task assignee (optional)
 * @returns Count of updated row
 */
export const updateTask = async (id: string, data: UpdateSchema) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const result = await dbPool.query(
    `
    UPDATE tasks
    SET ${keys
      .map((k, i) => `${k} = $${i + 1}${i + 1 < keys.length ? ',' : ''}`)
      .join(' ')}
    WHERE id = $${keys.length + 1}
    `,
    [...values, id],
  );

  return result.rowCount;
};

/**
 * Get tasks from database
 *
 * @param limit - Query limit
 * @param offset - Query offet
 * @param status - Task status
 * @param label - Task label
 * @param priority - Task priority
 * @param search - Task seach query
 * @returns Tasks
 */
export const getTasks = async (
  limit: number,
  offset: number,
  status?: Status,
  label?: Label,
  priority?: Priority,
  search?: string,
) => {
  if (search) search = `%${search}%`;

  const result = await dbPool.query(
    `
      SELECT * FROM tasks
      WHERE ($3::text IS NULL OR status = $3)
      AND ($4::text IS NULL OR label = $4)
      AND ($5::text IS NULL OR priority = $5)
      AND ($6::text IS NULL OR title ILIKE $6)
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
    [limit, offset, status, label, priority, search],
  );

  return result.rows;
};

/**
 * Delete task in database
 *
 * @param id - Task ID
 * @returns Number of deleted rows
 */
export const deleteTask = async (id: string) => {
  const result = await dbPool.query(
    `
    DELETE FROM tasks
    WHERE id = $1 `,
    [id],
  );

  return result.rowCount;
};
