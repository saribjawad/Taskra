import { Request, Response } from 'express';
import {
  CommentParamSchema,
  CreateCommentSchema,
  UpdateCommentParamSchema,
  UpdateCommentSchema,
} from '../schemas/comment.schema';
import { ApiResponse } from '../utils/ApiResponse';
import { findTaskByIdAndWorkspaceId } from '../services/task.service';
import { ApiError } from '../utils/ApiErrors';
import {
  createComment,
  deleteComment,
  findCommentById,
  updateComment,
} from '../services/comment.service';
import { notifyMemberInWorkspace } from '../websockets/init';

async function requireTask(taskId: string, workspaceId: string) {
  const task = await findTaskByIdAndWorkspaceId(taskId, workspaceId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  return task;
}

// ==================================================================================
// Task Comment Controllers
// ==================================================================================

export const CreateComment = async (req: Request, res: Response) => {
  const user = req.user;

  const { taskId } = CommentParamSchema.parse(req.params);

  const { content } = CreateCommentSchema.parse(req.body);

  const task = await requireTask(taskId, user.activeWorkspace);

  // Create the comment
  const comment = await createComment(task.id, user.id, content);

  if (!comment) {
    throw ApiError.internal('Something went wrong while creating comment');
  }

  // Notfiy the assignee and reporter if they are not the actor
  const notificationRecipents = new Set<string>([task.assignee, task.reporter]);

  for (const recipent of notificationRecipents) {
    if (recipent && recipent !== user.id) {
      notifyMemberInWorkspace(recipent, task.workspace_id, {
        type: 'task:commented',
        message: 'A new comment was added to a task you’re involved in',
        metaData: {
          actorId: user.id,
          taskId: task.id,
        },
      });
    }
  }

  return res.status(201).json(new ApiResponse(201, 'Comment created'));
};

export const UpdateComment = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = UpdateCommentParamSchema.parse(req.params);
  const { taskId, commentId } = parsedParams;

  const parsedBody = UpdateCommentSchema.parse(req.body);
  const { content } = parsedBody;

  await requireTask(taskId, workspaceId);

  // Check if commentId is valid
  const comment = await findCommentById(commentId);

  // Throw error 404 if not found
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  // Update comment
  const updatedRowsCount = await updateComment(commentId, content);

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal('Something went wrong while updating the comment');
  }

  return res.status(200).json(new ApiResponse(200, 'Comment updated'));
};

export const DeleteComment = async (req: Request, res: Response) => {
  const user = req.user;

  const parsedParams = UpdateCommentParamSchema.parse(req.params);
  const { taskId, commentId } = parsedParams;

  const task = await requireTask(taskId, user.activeWorkspace);

  // Check if commentId is valid
  const comment = await findCommentById(commentId);

  // Throw error 404 if not found
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  if (comment.user_id !== user.id) {
    throw ApiError.forbidden('You are not allowed to delete others comment');
  }

  const rowsDeleted = await deleteComment(commentId);

  if (!rowsDeleted || rowsDeleted <= 0) {
    throw ApiError.internal('Something went wrong while deleting the comment');
  }

  return res.status(200).json(new ApiResponse(200, 'Comment deleted'));
};
