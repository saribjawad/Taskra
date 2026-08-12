import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
  createWorkspaceMember,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  getWorkspaceMember,
} from '../services/workspace.service';
import {
  AcceptWorkspaceInviteSchema,
  CreateWorkspaceSchema,
  InviteToWorkspaceSchema,
  WorkspaceIdParamsSchema,
} from '../schemas/workspace.schema';
import { ApiError } from '../utils/ApiErrors';
import {
  findUserByEmail,
  findUserById,
  updateUser,
} from '../services/user.service';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import crypto from 'crypto';
import {
  createInvitation,
  deleteInvitation,
  getInvitationByHash,
  updateInvitationStatus,
} from '../services/invitation.service';
import { sendInviteToWorkspace } from '../lib/resend';
import { env } from '../config/env';

export const GetUserWorkspaces = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const workspaces = await getUserWorkspaces(userId);

  res.status(200).json(new ApiResponse(200, "User's workspaces", workspaces));
};

export const SwitchWorkspace = async (req: Request, res: Response) => {
  const user = req.user;
  const { workspaceId } = WorkspaceIdParamsSchema.parse(req.params);

  const workspace = await getWorkspaceById(workspaceId);

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

  const workspace = await getWorkspaceById(workspaceId);

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

export const InviteToWorkspace = async (req: Request, res: Response) => {
  // TODO: add role option

  const { email } = InviteToWorkspaceSchema.parse(req.body);
  const userId = req.user.id;
  const workspaceId = req.user.activeWorkspace;

  const user = await findUserById(userId);
  const workspace = await getWorkspaceById(workspaceId);

  const userToBeInvited = await findUserByEmail(email);
  if (!userToBeInvited) {
    return res.status(200).json(new ApiResponse(200, 'User not found'));
  }

  // Check if user is already member of workspace
  const userWorkspaceMemberShip = await getWorkspaceMember(
    userToBeInvited.id,
    workspaceId,
  );
  if (userWorkspaceMemberShip) {
    return res
      .status(200)
      .json(new ApiResponse(200, 'User is already member of the workspace'));
  }

  // Create token
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.hash('SHA-256', token);

  // Expiry date of 15 minutes
  const currentTimeAsMs = Date.now();
  const adjustedTimeAsMs = currentTimeAsMs + 5 * 60 * 1000;
  const expiryDate = new Date(adjustedTimeAsMs);

  // Create and save invitation
  const invitation = await createInvitation(
    email,
    'member',
    userId,
    workspaceId,
    hashedToken,
    expiryDate,
  );

  if (!invitation) {
    throw ApiError.internal(
      'Something went wrong while creating the invitation',
    );
  }

  const invitationLink = `${env.APP_URL}/invitation/${token}`;

  // Send the email to the user
  try {
    await sendInviteToWorkspace(user.username, workspace.name, invitationLink);
  } catch (error) {
    // Delete the created invitation
    await deleteInvitation(invitation.id);

    throw ApiError.internal(
      'Something went wrong while sending invitation, Try again later.',
    );
  }

  res.status(201).json(new ApiResponse(201, 'Invitation has been sent'));
};

export const AcceptWorkspaceInvite = async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  const { token } = AcceptWorkspaceInviteSchema.parse(req.params);

  const hashedToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationByHash(hashedToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.status === 'accepted') {
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been already accepted'));
  }

  if (invitation.status === 'revoked') {
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been revoked'));
  }

  if (invitation.expires_at < new Date()) {
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been expired'));
  }

  const workspaceToJoin = getWorkspaceById(invitation.workspace_id);

  if (!workspaceToJoin) {
    throw ApiError.notFound('Workspace not found');
  }

  // Add user to workspace
  const member = createWorkspaceMember(userId, invitation.workspace_id);

  if (!member) {
    throw ApiError.internal(
      'Something went wrong while creating the workspace member',
    );
  }

  // Update the status to 'accepted'
  const updatedRows = await updateInvitationStatus(invitation.id, 'accepted');

  if (!updatedRows || updatedRows < 1) {
    throw ApiError.internal(
      'Something went wrong while updating the invitation status',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Invite accepted'));
};
