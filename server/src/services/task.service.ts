import { PoolClient } from 'pg';
import { dbPool } from '../db';
import {
  Task,
  TaskLabelType,
  TaskPriorityType,
  TaskStatus,
  TaskStatusType,
  TaskFilterType,
} from '../models/task.model';

/**
 * Find task by ID and workspaceId in database
 *
 * @param id - Task uuid
 * @param workspaceId - Workspace uuid task belongs to
 * @returns The task row if found
 */
export const findTaskByIdAndWorkspaceId = async (
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
  payload: {
    title: string;
    description: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    label: TaskLabelType;
    workspaceId: string;
    teamId: string;
    userId: string;
    startDate: Date | undefined;
    dueDate: Date | undefined;
    assignee: string | null;
    reporter: string | null;
  },
  txClient?: PoolClient,
): Promise<Task> => {
  const {
    assignee,
    description,
    dueDate,
    label,
    priority,
    reporter,
    startDate,
    status,
    title,
    teamId,
    userId,
    workspaceId,
  } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
    `
    INSERT INTO tasks(title, description, status, priority, label, assignee, workspace_id, creator, reporter, start_date, due_date, team_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      teamId,
    ],
  );

  return result.rows[0];
};

/**
 * Update task in database
 *
 * @param payload - Task ID and fields to update
 * @returns Count of updated rows
 */
export const updateTask = async (
  payload: {
    id: string;
    title?: string;
    description?: string;
    assignee?: string | null;
    reporter?: string | null;
    label?: TaskLabelType;
    priority?: TaskPriorityType;
    status?: TaskStatus;
    start_date?: Date;
    due_date?: Date;
    project_id?: string | null;
    project_milestone_id?: string | null;
  },
  txClient?: PoolClient,
) => {
  const { id, ...data } = payload;
  const keys = Object.keys(data);
  const values = Object.values(data);
  const db = txClient || dbPool;

  const result = await db.query(
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
 * @param payload - Task ID and completion date
 * @returns Count of updated row
 */
export const markTaskAsComplete = async (
  payload: { id: string; completedDate: Date },
  txClient?: PoolClient,
) => {
  const { id, completedDate } = payload;
  const db = txClient || dbPool;
  const results = await db.query(
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
  status?: TaskStatusType,
  label?: TaskLabelType,
  priority?: TaskPriorityType,
  search?: string,
  userId?: string,
  filter: TaskFilterType = 'all',
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

export const getTasksByTeamId = async (
  teamId: string,
  limit: number,
  offset: number,
  status?: TaskStatusType,
  label?: TaskLabelType,
  priority?: TaskPriorityType,
  search?: string,
) => {
  const result = await dbPool.query(
    `
    SELECT * FROM tasks
    WHERE team_id = $1
      AND ($4::text IS NULL OR status = $4)
      AND ($5::text IS NULL OR label = $5)
      AND ($6::text IS NULL OR priority = $6)
      AND ($7::text IS NULL OR title ILIKE $7)
    ORDER BY created_at DESC, id DESC
    LIMIT $2 OFFSET $3
    `,
    [
      teamId,
      limit,
      offset,
      status,
      label,
      priority,
      search ? `%${search}%` : undefined,
    ],
  );

  return result.rows as Task[];
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

/**
 * Get all the tasks which belongs to a project
 *
 * @param project - Project ID
 * @returns Tasks
 */
export const getTasksByProjectId = async (
  projectId: string,
  limit: number,
  milestoneId?: string,
  cursorTime?: string,
  cursorId?: string,
  status?: string,
  priority?: string,
  label?: string,
): Promise<(Task & { cursor_time: string })[]> => {
  const result = await dbPool.query(
    `
    SELECT tasks.*, tasks.created_at::text AS cursor_time
    FROM tasks
    WHERE project_id = $1
    AND ($2::uuid IS NULL OR project_milestone_id = $2)
    AND ($3::text IS NULL OR status::text = $3)
    AND ($4::text IS NULL OR priority::text = $4)
    AND ($5::text IS NULL OR label::text = $5)
    AND (
        $6::timestamptz IS NULL
        OR (created_at, id) < ($6::timestamptz, $7::uuid)
      )
    ORDER BY created_at DESC, id DESC
    LIMIT $8
    `,
    [
      projectId,
      milestoneId ?? null,
      status ?? null,
      priority ?? null,
      label ?? null,
      cursorTime ?? null,
      cursorId ?? null,
      limit,
    ],
  );

  return result.rows;
};
