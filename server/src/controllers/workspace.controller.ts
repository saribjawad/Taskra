import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
  deleteWorkspace,
} from '../services/workspace.service';
import {
  CreateWorkspaceSchema,
  WorkspaceIdParamsSchema,
} from '../schemas/workspace.schema';
import { ApiError } from '../utils/ApiErrors';
import { updateUser } from '../services/user.service';
import { createWorkspaceMember } from '../services/workspaceMember.service';

export const CreateWorkspace = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { name } = CreateWorkspaceSchema.parse(req.body);

  const workspace = await createWorkspace(name);

  if (!workspace) {
    throw ApiError.internal('Something went wrong while creating workspace');
  }

  // Update the user's active workspace
  const updatedUser = await updateUser(userId, {
    active_workspace: workspace.id,
  });

  if (!updatedUser || updatedUser <= 0) {
    throw ApiError.internal('Something went wrong while updating user.');
  }

  // Create the workspace member
  const workspaceMember = await createWorkspaceMember(userId, workspace.id);

  if (!workspaceMember) {
    throw ApiError.internal(
      'Something went wrong while creating workspace member',
    );
  }

  res.status(201).json(new ApiResponse(200, 'Workspace created'));
};

export const DeleteWorkspace = async (req: Request, res: Response) => {
  const { workspaceId } = WorkspaceIdParamsSchema.parse(req.params);

  const deletedRowsCount = await deleteWorkspace(workspaceId);

  if (!deletedRowsCount || deletedRowsCount) {
    throw ApiError.internal('Something went wrong while deleting workspace');
  }

  res.status(200).json(new ApiResponse(200, 'Workspace deleted'));
};
