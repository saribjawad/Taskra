import { v4 as uuidv4 } from 'uuid';
import { deleteFileFromS3, FILE_TYPE, uploadFileToS3 } from '../config/s3';
import { executeTranscation } from '../db/transaction';
import { Attachment, AttachmentsMimeTypes } from '../models/attachments.model';
import { SubTask } from '../models/subTasks.model';
import {
  createAttachment,
  deleteAttachmentById,
} from '../services/attachment.service';
import { updateSubTask } from '../services/subTasks.service';
import logger from '../utils/logger';

type SubTaskUpdateFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function getUploadType(mimeType: string): FILE_TYPE {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}

export const updateSubTaskWorkflow = async (data: {
  subTask: SubTask;
  payload: Omit<Parameters<typeof updateSubTask>[0], 'id'>;
  files: SubTaskUpdateFile[];
  removedAttachments: Attachment[];
}) => {
  const { subTask, payload, files, removedAttachments } = data;
  const uploadedAttachments: string[] = [];
  const attachmentKeysToDelete = removedAttachments.map(
    (attachment) => attachment.storage_id,
  );

  try {
    for (const file of files) {
      const storageId = `attachment/${file.originalname}-${uuidv4()}`;
      const uploaded = await uploadFileToS3(
        getUploadType(file.mimetype),
        storageId,
        file.buffer,
      );
      if (!uploaded) {
        throw new Error(`Failed to upload attachment '${file.originalname}'`);
      }
      uploadedAttachments.push(storageId);
    }

    const result = await executeTranscation(async (txClient) => {
      const updated = Object.keys(payload).length
        ? await updateSubTask({ id: subTask.id, ...payload }, txClient)
        : subTask;

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        await createAttachment(
          {
            type: 'sub-task',
            subTaskId: subTask.id,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype as AttachmentsMimeTypes,
            storageId: uploadedAttachments[index],
          },
          txClient,
        );
      }

      for (const attachment of removedAttachments) {
        await deleteAttachmentById({ id: attachment.id }, txClient);
      }

      return updated;
    });

    for (const key of attachmentKeysToDelete) {
      try {
        await deleteFileFromS3(key);
      } catch (error) {
        logger.error(
          `Failed to delete removed subtask attachment '${key}' from S3`,
          error,
        );
      }
    }

    return result;
  } catch (error) {
    for (const key of uploadedAttachments) {
      try {
        await deleteFileFromS3(key);
      } catch (cleanupError) {
        logger.error(
          `Failed to clean up subtask attachment '${key}' from S3`,
          cleanupError,
        );
      }
    }
    throw error;
  }
};
