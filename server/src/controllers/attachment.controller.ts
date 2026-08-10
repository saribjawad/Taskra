import { Request, Response } from 'express';
import z, { prettifyError } from 'zod';
import { ApiResponse } from '../utils/ApiResponse';
import { getAttachmentById } from '../services/attachment.service';
import { ApiError } from '../utils/ApiErrors';
import { generatePresignedUrl } from '../config/s3';
import { findTaskById } from '../services/task.service';

// ==================================================================================
// Attachment Controllers
// ==================================================================================

export const GetPresignedUrlOfAttachment = async (
  req: Request,
  res: Response,
) => {
  const activeWorkspaceId = req.user.activeWorkspace;
  const { attachmentId } = z
    .object({ attachmentId: z.uuid('Invalid attachment ID') })
    .parse(req.params);

  const attachment = await getAttachmentById(attachmentId);

  if (!attachment) {
    throw ApiError.notFound('Unable to found the attachment');
  }

  const task = await findTaskById(attachment.task_id, activeWorkspaceId);

  if (!task) {
    throw ApiError.unauthorized('You are not member of this workspace');
  }

  const presignedUrl = await generatePresignedUrl(attachment.storage_id);

  if (!presignedUrl) {
    throw ApiError.internal(
      'Something went wrong while generating the presigned url',
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, 'Presigned url generated', { url: presignedUrl }),
    );
};
