import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { SubTask, SubTaskSummary } from '../models/subTasks.model';
import { Attachment } from '../models/attachments.model';
import {
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '../models/task.model';

export const getSubTasksByTaskId = async (
  taskId: string,
): Promise<SubTaskSummary[]> => {
  const result = await dbPool.query(
    `SELECT id, title, status, priority, label, assignee
     FROM sub_tasks
     WHERE task_id = $1
     ORDER BY created_at ASC, id ASC`,
    [taskId],
  );
  return result.rows;
};

export const getSubTaskDetailsByIdAndTaskId = async (
  subTaskId: string,
  taskId: string,
): Promise<SubTask | undefined> => {
  const result = await dbPool.query(
    `SELECT s.*, COALESCE(json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]') AS attachments
     FROM sub_tasks s
     LEFT JOIN attachments a ON a.sub_task_id = s.id
     WHERE s.id = $1 AND s.task_id = $2
     GROUP BY s.id`,
    [subTaskId, taskId],
  );
  return result.rows[0];
};

export const getSubTaskByIdAndTaskId = async (
  subTaskId: string,
  taskId: string,
): Promise<SubTask | undefined> => {
  const result = await dbPool.query(
    'SELECT * FROM sub_tasks WHERE id = $1 AND task_id = $2',
    [subTaskId, taskId],
  );
  return result.rows[0];
};

export const createSubTask = async (
  payload: {
    taskId: string;
    title: string;
    description?: string | null;
    status?: TaskStatusType;
    priority?: TaskPriorityType;
    label?: TaskLabelType;
    assignee?: string | null;
  },
  txClient?: PoolClient,
): Promise<SubTask> => {
  const db = txClient || dbPool;
  const result = await db.query(
    `INSERT INTO sub_tasks (task_id, title, description, status, priority, label, assignee)
     VALUES ($1, $2, $3, COALESCE($4, 'backlog'), COALESCE($5, 'no_priority'), $6, $7)
     RETURNING *`,
    [
      payload.taskId,
      payload.title,
      payload.description ?? null,
      payload.status ?? null,
      payload.priority ?? null,
      payload.label ?? null,
      payload.assignee ?? null,
    ],
  );
  return result.rows[0];
};

export const updateSubTask = async (
  payload: {
    id: string;
    title?: string;
    description?: string | null;
    status?: TaskStatusType;
    priority?: TaskPriorityType;
    label?: TaskLabelType | null;
    assignee?: string | null;
  },
  txClient?: PoolClient,
) => {
  const { id, ...data } = payload;

  const keys = Object.keys(data);
  const values = Object.values(data);

  const db = txClient || dbPool;
  const result = await db.query(
    `UPDATE sub_tasks SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}
    WHERE id = $${values.length + 1}
    RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as SubTask | undefined;
};

export const deleteSubTask = async (subTaskId: string) => {
  const result = await dbPool.query(
    'DELETE FROM sub_tasks WHERE id = $1 RETURNING id',
    [subTaskId],
  );
  return result.rows[0] as { id: string } | undefined;
};

export const getSubTaskAttachments = async (
  subTaskId: string,
): Promise<Attachment[]> => {
  const result = await dbPool.query(
    'SELECT * FROM attachments WHERE sub_task_id = $1',
    [subTaskId],
  );
  return result.rows;
};
