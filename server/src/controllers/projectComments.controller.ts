import { Request, Response } from 'express';
import {
  CreateCommentSchema,
  ProjectCommentParamSchema,
  UpdateProjectCommentParamSchema,
  UpdateCommentSchema,
} from '../schemas/comment.schema';
import {
  createProjectComment,
  deleteProjectComment,
  findProjectCommentById,
  updateProjectComment,
} from '../services/comment.service';
import { getProjectByIdAndWorkspaceId } from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';
import { ApiResponse } from '../utils/ApiResponse';

async function requireProject(projectId: string, workspaceId: string) {
  const project = await getProjectByIdAndWorkspaceId(projectId, workspaceId);

  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

// ==================================================================================
// Project Comment Controllers
// ==================================================================================

export const CreateProjectComment = async (req: Request, res: Response) => {
  const user = req.user;

  const { projectId } = ProjectCommentParamSchema.parse(req.params);

  const project = await requireProject(projectId, user.activeWorkspace);

  const { content } = CreateCommentSchema.parse(req.body);

  const comment = await createProjectComment(project.id, user.id, content);

  if (!comment) {
    throw ApiError.internal('Something went wrong while creating comment');
  }

  res.status(201).json(new ApiResponse(201, 'Project comment created'));
};

export const UpdateProjectComment = async (req: Request, res: Response) => {
  const user = req.user;

  const { projectId, commentId } = UpdateProjectCommentParamSchema.parse(
    req.params,
  );

  const project = await requireProject(projectId, user.activeWorkspace);

  const { content } = UpdateCommentSchema.parse(req.body);

  const comment = await findProjectCommentById(commentId, project.id);

  if (!comment) throw ApiError.notFound('Comment not found');

  if (comment.user_id !== user.id) {
    throw ApiError.forbidden('You are not allowed to update others comments');
  }

  const updatedRows = await updateProjectComment(
    commentId,
    project.id,
    content,
  );

  if (!updatedRows) {
    throw ApiError.internal('Something went wrong while updating the comment');
  }

  res.status(200).json(new ApiResponse(200, 'Project comment updated'));
};

export const DeleteProjectComment = async (req: Request, res: Response) => {
  const user = req.user;

  const { projectId, commentId } = UpdateProjectCommentParamSchema.parse(
    req.params,
  );

  const project = await requireProject(projectId, user.activeWorkspace);

  const comment = await findProjectCommentById(commentId, project.id);

  if (!comment) throw ApiError.notFound('Comment not found');

  if (comment.user_id !== user.id) {
    throw ApiError.forbidden('You are not allowed to delete others comments');
  }

  const deletedRows = await deleteProjectComment(commentId, project.id);

  if (!deletedRows) {
    throw ApiError.internal('Something went wrong while deleting the comment');
  }

  res.status(200).json(new ApiResponse(200, 'Project comment deleted'));
};
