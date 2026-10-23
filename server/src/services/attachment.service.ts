import { PoolClient } from 'pg';
import { dbPool } from '../db';
import {
  Attachment,
  AttachmentOwner,
  AttachmentsMimeTypes,
} from '../models/attachments.model';

/**
 * Create attachments in database
 *
 * @param taskId - Task uuid
 * @param name - Attachment name
 * @param size - Size of the attachment
 * @param mimeType - MimeType of the attachment
 * @param storageId - Storage id of the attachment on S3
 * @returns The created comment
 */
export const createAttachment = async (
  payload: AttachmentOwner & {
    name: string;
    size: number;
    mimeType: AttachmentsMimeTypes;
    storageId: string;
  },
  txClient?: PoolClient,
) => {
  const { mimeType, name, size, storageId } = payload;
  const taskId = payload.type === 'task' ? payload.taskId : null;
  const subTaskId = payload.type === 'sub-task' ? payload.subTaskId : null;
  const projectId = payload.type === 'project' ? payload.projectId : null;

  const db = txClient || dbPool;
  const result = await db.query(
    `
    INSERT INTO attachments (
      type,
      task_id,
      sub_task_id,
      project_id,
      name,
      size,
      mime_type,
      storage_id
    )
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      payload.type,
      taskId,
      subTaskId,
      projectId,
      name,
      size,
      mimeType,
      storageId,
    ],
  );

  return result.rows[0];
};

export const getAttachmentsBySubTaskId = async (
  subTaskId: string,
): Promise<Attachment[]> => {
  const result = await dbPool.query(
    'SELECT * FROM attachments WHERE sub_task_id = $1 ORDER BY created_at ASC',
    [subTaskId],
  );
  return result.rows;
};

export const getAttachmentByIdAndSubTaskId = async (
  attachmentId: string,
  subTaskId: string,
): Promise<Attachment | undefined> => {
  const result = await dbPool.query(
    'SELECT * FROM attachments WHERE id = $1 AND sub_task_id = $2',
    [attachmentId, subTaskId],
  );
  return result.rows[0];
};

/**
 * Get task attachments
 *
 * @param taskId - Task uuid
 * @returns Attachments
 */
export const getAttachmentsByTaskId = async (
  taskId: string,
): Promise<Attachment[]> => {
  const result = await dbPool.query(
    `
    SELECT * FROM attachments
    WHERE task_id = $1
    `,
    [taskId],
  );

  return result.rows;
};

/**
 * Get task attachment by ID
 *
 * @param payload - Attachment ID
 * @returns Attachments
 */
export const getAttachmentById = async (
  attachmentId: string,
): Promise<Attachment> => {
  const result = await dbPool.query(
    `
    SELECT * FROM attachments
    WHERE id = $1
    `,
    [attachmentId],
  );

  return result.rows[0];
};

export const getAttachmentOwnerWorkspaceId = async (
  attachment: Attachment,
): Promise<string | undefined> => {
  if (attachment.type === 'task' && attachment.task_id) {
    const result = await dbPool.query(
      'SELECT workspace_id FROM tasks WHERE id = $1',
      [attachment.task_id],
    );
    return result.rows[0]?.workspace_id;
  }
  if (attachment.type === 'sub-task' && attachment.sub_task_id) {
    const result = await dbPool.query(
      'SELECT tasks.workspace_id FROM sub_tasks JOIN tasks ON tasks.id = sub_tasks.task_id WHERE sub_tasks.id = $1',
      [attachment.sub_task_id],
    );
    return result.rows[0]?.workspace_id;
  }
  if (attachment.type === 'project' && attachment.project_id) {
    const result = await dbPool.query(
      'SELECT workspace_id FROM projects WHERE id = $1',
      [attachment.project_id],
    );
    return result.rows[0]?.workspace_id;
  }
  return undefined;
};

/**
 * Get task attachment by ID and task Id
 *
 * @param attachmentId - Attachment uuid
 * @param taskId - Task uuid
 * @returns Attachments
 */
export const getAttachmentByIdAndTaskId = async (
  attachmentId: string,
  taskId: string,
): Promise<Attachment> => {
  const result = await dbPool.query(
    `
    SELECT * FROM attachments
    WHERE id = $1 AND task_id = $2
    `,
    [attachmentId, taskId],
  );

  return result.rows[0];
};

/**
 * Delete task attachment by ID
 *
 * @param attachmentId - Attachment uuid
 * @returns Attachments
 */
export const deleteAttachmentById = async (
  payload: { id: string },
  txClient?: PoolClient,
): Promise<Attachment> => {
  const { id } = payload;
  const db = txClient || dbPool;
  const result = await db.query(
    `
    DELETE FROM attachments
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
};
