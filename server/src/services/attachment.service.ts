import { dbPool } from '../db';
import { AttachmentsMimeTypes } from '../models/attachments.model';

/**
 * Create attachments in database
 *
 * @param taskId - Task uuid
 * @param name - Attachment name
 * @param size - Size of the attachment
 * @param mimeType - mimeType of the attachment
 * @returns The created comment
 */
export const createAttachment = async (
  taskId: string,
  name: string,
  size: number,
  mimeType: AttachmentsMimeTypes,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO attachments (
      task_id,
      name,
      size,
      mime_type
    )
    VALUES($1, $2, $3, $4)
    `,
    [taskId, name, size, mimeType],
  );

  return result.rows[0];
};
