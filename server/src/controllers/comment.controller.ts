import { Request, Response } from 'express';
import {
  CommentParamSchema,
  CreateCommentSchema,
  UpdateCommentParamSchema,
  UpdateCommentSchema,
} from '../schemas/comment.schema';
import { ApiResponse } from '../utils/ApiResponse';
import { findTaskById } from '../services/task.service';
import { ApiError } from '../utils/ApiErrors';
import {
  createComment,
  deleteComment,
  findCommentById,
  updateComment,
} from '../services/comment.service';

// ==================================================================================
// Comment Controllers
// ==================================================================================

export const CreateComment = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = CommentParamSchema.parse(req.params);
  const userId = req.user.id;

  const { taskId } = parsedParams;

  const parsedBody = CreateCommentSchema.parse(req.body);
  const { content } = parsedBody;

  // Check if taskId is valid
  const task = await findTaskById(taskId, workspaceId);

  // Throw error 404 if not found
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Create the comment
  const comment = await createComment(taskId, userId, content);

  if (!comment) {
    throw ApiError.internal('Something went wrong while creating comment');
  }

  return res.status(201).json(new ApiResponse(201, 'Comment created'));
};

export const UpdateComment = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = UpdateCommentParamSchema.parse(req.params);
  const { taskId, commentId } = parsedParams;

  const parsedBody = UpdateCommentSchema.parse(req.body);
  const { content } = parsedBody;

  // Check if taskId is valid
  const task = await findTaskById(taskId, workspaceId);

  // Throw error 404 if not found
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

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
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = UpdateCommentParamSchema.parse(req.params);
  const { taskId, commentId } = parsedParams;

  // Check if taskId is valid
  const task = await findTaskById(taskId, workspaceId);

  // Throw error 404 if not found
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Check if commentId is valid
  const comment = await findCommentById(commentId);

  // Throw error 404 if not found
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  const rowsDeleted = await deleteComment(commentId);

  if (!rowsDeleted || rowsDeleted <= 0) {
    throw ApiError.internal('Something went wrong while deleting the comment');
  }

  return res.status(200).json(new ApiResponse(200, 'Comment deleted'));
};
