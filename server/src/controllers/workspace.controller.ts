import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
  createWorkspaceMember,
  deleteWorkspace,
  getUserWorkspaces,
} from '../services/workspace.service';
import {
  CreateWorkspaceSchema,
  WorkspaceIdParamsSchema,
} from '../schemas/workspace.schema';
import { ApiError } from '../utils/ApiErrors';
import { updateUser } from '../services/user.service';
import { generateAccessToken, generateRefreshToken } from '../utils/token';

export const GetUserWorkspaces = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const workspaces = await getUserWorkspaces(userId);

  res.status(200).json(new ApiResponse(200, "User's workspaces", workspaces));
};

export const CreateWorkspace = async (req: Request, res: Response) => {
  const user = req.user;
  const { name } = CreateWorkspaceSchema.parse(req.body);

  const workspace = await createWorkspace(name);

  if (!workspace) {
    throw ApiError.internal('Something went wrong while creating workspace');
  }

  // Update the user's active workspace
  const updatedUser = await updateUser(user.id, {
    active_workspace: workspace.id,
  });

  if (!updatedUser || updatedUser <= 0) {
    throw ApiError.internal('Something went wrong while updating user.');
  }

  // Create the workspace member
  const workspaceMember = await createWorkspaceMember(user.id, workspace.id);

  if (!workspaceMember) {
    throw ApiError.internal(
      'Something went wrong while creating workspace member',
    );
  }

  const accessToken = generateAccessToken(user.id, user.email, workspace.id);
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    workspace.id,
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

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
