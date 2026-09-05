import { dbPool } from '../db';
import {
  Task,
  TaskLabel,
  TaskPriority,
  TaskStatus,
} from '../models/task.model';
import {
  FilterType,
  LabelType,
  Priority,
  StatusType,
} from '../schemas/task.schema';

/**
 * Find task by ID in database
 *
 * @param id - Task uuid
 * @param workspaceId - Workspace uuid task belongs to
 * @returns The task row if found, otherwise undefined
 */
export const findTaskById = async (
  id: string,
  workspaceId: string,
): Promise<Task> => {
  const result = await dbPool.query(
    `
    SELECT * FROM tasks WHERE id = $1
    AND workspace_id = $2
    `,
    [id, workspaceId],
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
 * @param workspaceId - Workspace ID tasks belongs to
 * @param userId - ID of the user who created the task
 * @param startDate - Start date of task
 * @param dueDate - Due date of task
 * @param assignee - Task assignee
 * @param reporter - Task reporter
 *
 * @returns The created task
 */
export const createTask = async (
  title: string,
  description: string,
  status: string,
  priority: string,
  label: string,
  workspaceId: string,
  userId: string,
  startDate: Date | undefined,
  dueDate: Date | undefined,
  assignee: string | null,
  reporter: string | null,
): Promise<Task> => {
  const result = await dbPool.query(
    `
    INSERT INTO tasks(title, description, status, priority, label, assignee, workspace_id, creator, reporter, start_date, due_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      title,
      description,
      status,
      priority,
      label,
      assignee,
      workspaceId,
      userId,
      reporter,
      startDate,
      dueDate,
    ],
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
 * @param reporter - Task reporter (optional)
 * @param startDate - Task start date (optional)
 * @param dueDate - Task due date (optional)
 * @returns Count of updated row
 */
export const updateTask = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    assignee?: string | null;
    reporter?: string | null;
    label?: TaskLabel;
    priority?: TaskPriority;
    status?: TaskStatus;
    start_date?: Date;
    due_date?: Date;
  },
) => {
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
 * Mark task as completed in database
 *
 * @param id - Task ID
 * @param completedDate - Date of task completed at
 * @returns Count of updated row
 */
export const markTaskAsComplete = async (id: string, completedDate: Date) => {
  const results = await dbPool.query(
    `
    UPDATE tasks
    SET status = 'done', completed_date = $1
    WHERE id = $2`,
    [completedDate, id],
  );

  return results.rowCount;
};

/**
 * Get tasks from database
 *
 * @param limit - Query limit
 * @param workspaceId - UUID of workspace to which task belongs to
 * @param offset - Query offet
 * @param status - Task status
 * @param label - Task label
 * @param priority - Task priority
 * @param search - Task seach query
 * @param userId - User Id for quering created and assigned tasks
 * @param filter - Task filter query
 * @returns Tasks
 */
export const getTasks = async (
  limit: number,
  workspaceId: string,
  offset: number,
  status?: StatusType,
  label?: LabelType,
  priority?: Priority,
  search?: string,
  userId?: string,
  filter: FilterType = 'all',
) => {
  if (search) search = `%${search}%`;
  let result;

  switch (filter) {
    case 'all':
      result = await dbPool.query(
        `
      SELECT * FROM tasks
      WHERE ($3::text IS NULL OR status = $3)
      AND ($4::text IS NULL OR label = $4)
      AND ($5::text IS NULL OR priority = $5)
      AND ($6::text IS NULL OR title ILIKE $6)
      AND ($7::uuid IS NULL OR workspace_id = $7)
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
        [limit, offset, status, label, priority, search, workspaceId],
      );

      return result.rows;

    case 'created':
      result = await dbPool.query(
        `
      SELECT * FROM tasks
      WHERE ($3::text IS NULL OR status = $3)
      AND ($4::text IS NULL OR label = $4)
      AND ($5::text IS NULL OR priority = $5)
      AND ($6::text IS NULL OR title ILIKE $6)
      AND ($7::uuid IS NULL OR workspace_id = $7)
      AND ($8::uuid IS NULL OR creator = $8)
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
        [limit, offset, status, label, priority, search, workspaceId, userId],
      );

      return result.rows;

    case 'assigned':
      result = await dbPool.query(
        `
      SELECT * FROM tasks
      WHERE ($3::text IS NULL OR status = $3)
      AND ($4::text IS NULL OR label = $4)
      AND ($5::text IS NULL OR priority = $5)
      AND ($6::text IS NULL OR title ILIKE $6)
      AND ($7::uuid IS NULL OR workspace_id = $7)
      AND ($8::uuid IS NULL OR assignee = $8)
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
        [limit, offset, status, label, priority, search, workspaceId, userId],
      );

      return result.rows;
  }
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
