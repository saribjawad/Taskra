import { dbPool } from '../db';

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
