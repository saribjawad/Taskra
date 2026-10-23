import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  deleteFileFromS3,
  FILE_TYPE,
  generatePresignedUrl,
  uploadFileToS3,
} from '../config/s3';
import { executeTranscation } from '../db/transaction';
import {
  getAttachmentByIdAndSubTaskId,
  createAttachment,
  getAttachmentsBySubTaskId,
} from '../services/attachment.service';
import { findTaskByIdAndWorkspaceId } from '../services/task.service';
import { getWorkspaceMember } from '../services/workspace.service';
import {
  createSubTask,
  deleteSubTask,
  getSubTaskAttachments,
  getSubTaskByIdAndTaskId,
  getSubTaskDetailsByIdAndTaskId,
  getSubTasksByTaskId,
  updateSubTask,
} from '../services/subTasks.service';
import { updateSubTaskWorkflow } from '../transactions/subTasks.transactions';
import { ApiError } from '../utils/ApiErrors';
import { ApiResponse } from '../utils/ApiResponse';
import {
  CreateSubTaskSchema,
  SubTaskAttachmentParamsSchema,
  SubTaskItemParamsSchema,
  SubTaskParamsSchema,
  UpdateSubTaskSchema,
} from '../schemas/subTasks.schema';

// ==================================================================================
// Helpers
// ==================================================================================

type UploadedFile = Express.Multer.File;

function getFiles(req: Request): UploadedFile[] {
  const files = req.files as Record<string, UploadedFile[]> | undefined;
  return [
    ...(files?.images ?? []),
    ...(files?.pdf ?? []),
    ...(files?.document ?? []),
  ];
}

function getUploadType(mimeType: string): FILE_TYPE {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}

async function requireTask(req: Request, taskId: string) {
  const task = await findTaskByIdAndWorkspaceId(
    taskId,
    req.user.activeWorkspace,
  );
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

// ==================================================================================
// Sub Task Controllers
// ==================================================================================

export const GetSubTasks = async (req: Request, res: Response) => {
  const { taskId } = SubTaskParamsSchema.parse(req.params);

  await requireTask(req, taskId);

  const subTasks = await getSubTasksByTaskId(taskId);

  return res
    .status(200)
    .json(new ApiResponse(200, 'Subtasks fetched', subTasks));
};

export const GetSubTask = async (req: Request, res: Response) => {
  const { taskId, subTaskId } = SubTaskItemParamsSchema.parse(req.params);

  await requireTask(req, taskId);
  const subTask = await getSubTaskDetailsByIdAndTaskId(subTaskId, taskId);
  if (!subTask) throw ApiError.notFound('Subtask not found');

  return res.status(200).json(new ApiResponse(200, 'Subtask fetched', subTask));
};

export const CreateSubTask = async (req: Request, res: Response) => {
  const { taskId } = SubTaskParamsSchema.parse(req.params);
  const { body } = CreateSubTaskSchema.parse({
    body: req.body,
    files: req.files,
  });
  const { title, description } = body;
  const task = await requireTask(req, taskId);
  let assignee: string | null = null;
  if (body.assignee) {
    const member = await getWorkspaceMember(body.assignee, task.workspace_id);
    if (!member) throw ApiError.notFound('Assignee not found');
    assignee = member.user_id;
  }
  const files = getFiles(req);
  const uploadedKeys: string[] = [];

  try {
    for (const file of files) {
      const storageId = `attachment/${file.originalname}-${uuidv4()}`;
      const uploaded = await uploadFileToS3(
        getUploadType(file.mimetype),
        storageId,
        file.buffer,
      );
      if (!uploaded)
        throw ApiError.internal(
          `Failed to upload attachment '${file.originalname}'`,
        );
      uploadedKeys.push(storageId);
    }

    const subTask = await executeTranscation(async (txClient) => {
      // Create sub task
      const created = await createSubTask(
        {
          taskId,
          title,
          description,
          status: body.status,
          priority: body.priority,
          label: body.label,
          assignee,
        },
        txClient,
      );

      // Create attachments
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        await createAttachment(
          {
            type: 'sub-task',
            subTaskId: created.id,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype as Parameters<
              typeof createAttachment
            >[0]['mimeType'],
            storageId: uploadedKeys[index],
          },
          txClient,
        );
      }
      return created;
    });

    const attachments = await getAttachmentsBySubTaskId(subTask.id);
    return res
      .status(201)
      .json(
        new ApiResponse(201, 'Subtask created', { ...subTask, attachments }),
      );
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteFileFromS3(key)));
    throw error;
  }
};

export const UpdateSubTask = async (req: Request, res: Response) => {
  const { taskId, subTaskId } = SubTaskItemParamsSchema.parse(req.params);
  const { body } = UpdateSubTaskSchema.parse({
    body: req.body,
    files: req.files,
  });
  const { clearFields, removedAttachmentIds, ...fields } = body;

  const task = await requireTask(req, taskId);
  if (fields.assignee && clearFields.includes('assignee')) {
    throw ApiError.badRequest(
      'Cannot set and clear the assignee at the same time',
    );
  }
  if (fields.assignee) {
    const member = await getWorkspaceMember(fields.assignee, task.workspace_id);
    if (!member) {
      throw ApiError.forbidden('Assignee is not member of this workspace');
    }
  }

  const payload: Omit<Parameters<typeof updateSubTask>[0], 'id'> = {
    ...fields,
  };
  clearFields.forEach((field) => {
    payload[field] = null;
  });

  const subTask = await getSubTaskByIdAndTaskId(subTaskId, taskId);
  if (!subTask) {
    throw ApiError.notFound('Subtask not found');
  }

  const removedAttachments = await Promise.all(
    removedAttachmentIds.map(async (attachmentId) => {
      const attachment = await getAttachmentByIdAndSubTaskId(
        attachmentId,
        subTask.id,
      );
      if (!attachment) throw ApiError.notFound('Attachment not found');
      return attachment;
    }),
  );

  const files = getFiles(req);
  const updated = await updateSubTaskWorkflow({
    subTask,
    payload,
    files,
    removedAttachments,
  });
  const attachments = await getAttachmentsBySubTaskId(subTaskId);

  return res
    .status(200)
    .json(new ApiResponse(200, 'Subtask updated', { ...updated, attachments }));
};

export const DeleteSubTask = async (req: Request, res: Response) => {
  const { taskId, subTaskId } = SubTaskItemParamsSchema.parse(req.params);

  await requireTask(req, taskId);
  const subTask = await getSubTaskByIdAndTaskId(subTaskId, taskId);

  if (!subTask) {
    throw ApiError.notFound('Subtask not found');
  }

  const attachments = await getSubTaskAttachments(subTaskId);
  await deleteSubTask(subTaskId);

  await Promise.allSettled(
    attachments.map((attachment) => deleteFileFromS3(attachment.storage_id)),
  );

  return res.status(200).json(new ApiResponse(200, 'Subtask deleted'));
};

export const GetSubTaskAttachmentUrl = async (req: Request, res: Response) => {
  const { taskId, subTaskId, attachmentId } =
    SubTaskAttachmentParamsSchema.parse(req.params);

  await requireTask(req, taskId);

  const subTask = await getSubTaskByIdAndTaskId(subTaskId, taskId);
  if (!subTask) {
    throw ApiError.notFound('Subtask not found');
  }

  const attachments = await getAttachmentsBySubTaskId(subTaskId);
  const attachment = attachments.find((item) => item.id === attachmentId);

  if (!attachment) {
    throw ApiError.notFound('Attachment not found');
  }

  const url = await generatePresignedUrl(attachment.storage_id);
  return res
    .status(200)
    .json(new ApiResponse(200, 'Presigned url generated', { url }));
};
