import { deleteFileFromS3, FILE_TYPE, uploadFileToS3 } from '../config/s3';
import { executeTranscation } from '../db/transaction';
import { createAttachment } from '../services/attachment.service';
import { createComment } from '../services/comment.service';
import { createNotification } from '../services/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

interface CreateCommentTransactionParams {
  user: {
    id: string;
  };
  task: {
    id: string;
    workspace_id: string;
  };
  notificationRecipents: Set<string>;
  files: any[];
  content: string;
}

export const createCommentTransaction = async (
  data: CreateCommentTransactionParams,
) => {
  const { notificationRecipents, user, task, files, content } = data;
  const uploadedAttachments: string[] = [];

  try {
    await executeTranscation(async (txClient) => {
      // Create comment
      const comment = await createComment(
        {
          taskId: task.id,
          userId: user.id,
          content,
        },
        txClient,
      );

      // Create notification on DB
      for (const recipent of notificationRecipents) {
        if (recipent && recipent !== user.id) {
          createNotification(
            {
              metaData: {
                actorId: user.id,
                taskId: task.id,
              },
              message: 'A new comment was added to a task you’re involved in',
              type: 'task:commented',
              userId: recipent,
              workspaceId: task.workspace_id,
            },
            txClient,
          );
        }
      }

      // Create the attachemnt

      const result = await Promise.allSettled(
        files?.map(async (f) => {
          const storageId = `comment-attachments/${f.originalname}-${uuidv4()}`;

          // Upload the file to s3
          await uploadFileToS3(f.mimetype as FILE_TYPE, storageId, f.buffer);

          uploadedAttachments.push(storageId);

          // Save the attachment in DB
          await createAttachment(
            {
              type: 'comment',
              commentId: comment.id,
              name: f.originalname,
              size: f.size,
              mimeType: f.mimetype,
              storageId,
            },
            txClient,
          );
        }),
      );

      for (const r of result) {
        if (r.status === 'rejected') {
          throw r.reason;
        }
      }
    });
  } catch (e) {
    logger.info(
      'Comment creation failed: removing uploaded attachments from s3',
    );
    // Remove the attachment uploaded to s3
    for (const key of uploadedAttachments) {
      try {
        await deleteFileFromS3(key);
      } catch (cleanupError) {
        logger.error(
          `Failed to clean up comment attachment '${key}' from S3`,
          cleanupError,
        );
      }
    }

    throw e;
  }
};
