import { Request, Response } from 'express';
import {
  CommentParamSchema,
  CreateCommentSchema,
} from '../schemas/comment.schema';
import { ApiResponse } from '../utils/ApiResponse';
import { findTaskById } from '../services/task.service';
import { ApiError } from '../utils/ApiErrors';
import { createComment } from '../services/comment.service';

// ==================================================================================
// Task Controllers
// ==================================================================================

export const CreateComment = async (req: Request, res: Response) => {
  const parsedParams = CommentParamSchema.parse(req.params);
  const userId = req.user.id;

  const { taskId } = parsedParams;

  const parsedBody = CreateCommentSchema.parse(req.body);
  const { content } = parsedBody;

  // Check if taskId is valid
  const task = await findTaskById(taskId);

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
