import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { Attachment, AttachmentsMimeTypes } from '../models/attachments.model';

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
  payload: {
    taskId: string;
    name: string;
    size: number;
    mimeType: AttachmentsMimeTypes;
    storageId: string;
  },
  txClient?: PoolClient,
) => {
  const { mimeType, name, size, storageId, taskId } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
    `
    INSERT INTO attachments (
      task_id,
      name,
      size,
      mime_type,
      storage_id
    )
    VALUES($1, $2, $3, $4, $5)
    `,
    [taskId, name, size, mimeType, storageId],
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
