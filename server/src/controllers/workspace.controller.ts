import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
  createWorkspaceMember,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspace,
  getWorkspaceMember,
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

export const SwitchWorkspace = async (req: Request, res: Response) => {
  const user = req.user;
  const { workspaceId } = WorkspaceIdParamsSchema.parse(req.params);

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const workspaceMember = await getWorkspaceMember(user.id, workspaceId);

  if (!workspaceMember) {
    throw new ApiError(403, 'You are not a member of this workspace');
  }

  const updatedRowCount = await updateUser(user.id, {
    active_workspace: workspaceId,
  });

  if (updatedRowCount && updatedRowCount < 0) {
    throw ApiError.internal('Something went wrong while switching workspace');
  }

  const accessToken = generateAccessToken(
    user.id,
    user.email,
    (user.activeWorkspace = workspaceId),
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    (user.activeWorkspace = workspaceId),
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

  res
    .status(200)
    .json(new ApiResponse(201, 'Workspace switched', workspaceMember));
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

  res.status(201).json(
    new ApiResponse(200, 'Workspace created', {
      workspaceId: workspace.id,
    }),
  );
};

export const DeleteWorkspace = async (req: Request, res: Response) => {
  const user = req.user;
  const { workspaceId } = WorkspaceIdParamsSchema.parse(req.params);

  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const deletedRowsCount = await deleteWorkspace(workspaceId);

  if (!deletedRowsCount) {
    throw ApiError.internal('Something went wrong while deleting workspace');
  }

  const userWorkspaces = await getUserWorkspaces(user.id);

  if (userWorkspaces.length === 0) {
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      (user.activeWorkspace = ''),
    );
    const refreshToken = await generateRefreshToken(
      user.id,
      user.email,
      (user.activeWorkspace = ''),
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/api/v1/refresh-access-token',
    });

    return res.status(200).json(
      new ApiResponse(200, 'Workspace deleted', {
        newActiveWorkspace: null,
      }),
    );
  }

  const newActiveWorkspaceId = userWorkspaces[0].id;

  const updatedUser = await updateUser(user.id, {
    active_workspace: newActiveWorkspaceId,
  });

  if (!updatedUser) {
    throw ApiError.internal(
      'Something went wrong while updating user active workspace',
    );
  }

  const accessToken = generateAccessToken(
    user.id,
    user.email,
    (user.activeWorkspace = newActiveWorkspaceId),
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    (user.activeWorkspace = newActiveWorkspaceId),
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

  res.status(200).json(
    new ApiResponse(200, 'Workspace deleted', {
      newActiveWorkspaceId,
    }),
  );
};
