import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
  createWorkspaceMember,
  deleteWorkspace,
  deleteWorkspaceMember,
  getUserWorkspaces,
  getWorkspaceById,
  getWorkspaceMember,
  getWorkspaceUsers,
} from '../services/workspace.service';
import {
  VerifyWorkspaceInvitationParamsSchema,
  CreateWorkspaceSchema,
  DeclineWorkspaceInviteParamsSchema,
  GetWorkspaceInvitesParamsSchema,
  GetWorkspaceUsersParamsSchema,
  InviteToWorkspaceParamsSchema,
  InviteToWorkspaceSchema,
  RemoveMemberFromWorkspaceSchema,
  RevokeWorkspaceInviteParamsSchema,
  WorkspaceIdParamsSchema,
  AcceptWorkspaceInviteParamsSchema,
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
  getInvitationDetailByHash,
  getPendingInvitation,
  getWorkspaceInvitations,
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

export const RemoveMemberFromWorkspace = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user.id;
  const { memberId, workspaceId } = RemoveMemberFromWorkspaceSchema.parse(
    req.params,
  );

  const isUserMemberOfWorkspace = await getWorkspaceMember(userId, workspaceId);

  if (!isUserMemberOfWorkspace) {
    throw ApiError.forbidden(
      'You do not have permission to remove members from this workspace',
    );
  }

  const user = await findUserById(memberId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const userWorkspaceMembership = await getWorkspaceMember(
    memberId,
    workspaceId,
  );

  if (!userWorkspaceMembership) {
    throw ApiError.forbidden('User is not member of the workspace');
  }

  const deleteRowCount = await deleteWorkspaceMember(memberId, workspaceId);

  if (!deleteRowCount || deleteRowCount < 1) {
    throw ApiError.internal(
      'Something went wrong while deleting the workspace member',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Workspace member deleted'));
};

export const InviteToWorkspace = async (req: Request, res: Response) => {
  // TODO: add role option

  const { workspaceId } = InviteToWorkspaceParamsSchema.parse(req.params);
  const { email } = InviteToWorkspaceSchema.parse(req.body);
  const userId = req.user.id;

  const user = await findUserById(userId);
  const workspace = await getWorkspaceById(workspaceId);
  const existingInvite = await getPendingInvitation(email, workspaceId);

  // TODO: enforce this at the database level too.
  if (existingInvite) {
    throw ApiError.badRequest(
      'An invitation has already been sent to this user',
    );
  }
  // If user exists check
  const userToBeInvited = await findUserByEmail(email);

  if (userToBeInvited) {
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

  const invitationLink = `${env.APP_URL}/workspace-invitation?token=${token}`;

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

  const { token } = AcceptWorkspaceInviteParamsSchema.parse(req.params);

  const hashedToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationByHash(hashedToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (req.user.email !== invitation.email) {
    throw ApiError.forbidden(
      'This invitation was sent to a different email address',
    );
  }

  const existingMembership = await getWorkspaceMember(
    userId,
    invitation.workspace_id,
  );

  if (existingMembership) {
    throw ApiError.badRequest('You are already a member of this workspace');
  }

  if (invitation.status !== 'pending') {
    throw ApiError.badRequest('This invitation is no longer valid');
  }

  if (invitation.expires_at < new Date()) {
    // Update invitation status to 'expired'
    await updateInvitationStatus(invitation.id, 'expired');
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been expired'));
  }

  const workspaceToJoin = await getWorkspaceById(invitation.workspace_id);

  if (!workspaceToJoin) {
    throw ApiError.notFound('Workspace not found');
  }

  // Add user to workspace
  const member = await createWorkspaceMember(userId, invitation.workspace_id);

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

export const DeclineWorkspaceInvite = async (req: Request, res: Response) => {
  const { token } = DeclineWorkspaceInviteParamsSchema.parse(req.params);

  const hashToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationByHash(hashToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw ApiError.badRequest('This invitation is no longer valid');
  }

  if (req.user.email !== invitation.email) {
    throw ApiError.forbidden(
      'This invitation was sent to a different email address',
    );
  }

  if (invitation.expires_at < new Date()) {
    // Update invitation status to 'expired'
    await updateInvitationStatus(invitation.id, 'expired');
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been expired'));
  }

  // Update the status to 'declined'
  const updatedRows = await updateInvitationStatus(invitation.id, 'declined');

  if (!updatedRows || updatedRows < 1) {
    throw ApiError.internal(
      'Something went wrong while updating the invitation status',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Workspace invite declined'));
};

export const RevokeWorkspaceInvite = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { token } = RevokeWorkspaceInviteParamsSchema.parse(req.params);

  const hashToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationByHash(hashToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // If invited user himself is trying revoking
  const invitedUser = await findUserById(userId);

  if (invitedUser.email === invitation.email) {
    throw ApiError.forbidden('You are not allowed to revoke the invitation');
  }

  // Check if the user belongs to the workspace of the invitation
  const isWorkspaceMember = await getWorkspaceMember(
    userId,
    invitation.workspace_id,
  );

  if (!isWorkspaceMember) {
    throw ApiError.forbidden('You are not allowed to revoke the invitation');
  }

  // Update the status to 'revoked'
  const updatedRows = await updateInvitationStatus(invitation.id, 'revoked');

  if (!updatedRows || updatedRows < 1) {
    throw ApiError.internal(
      'Something went wrong while updating the invitation status',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Workspace invite revoked'));
};

export const GetWorkspaceInvites = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { workspaceId } = GetWorkspaceInvitesParamsSchema.parse(req.params);

  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isWorkspaceMember = await getWorkspaceMember(userId, workspace.id);

  if (!isWorkspaceMember) {
    throw ApiError.badRequest('You are not member of this workspace');
  }

  const invitations = await getWorkspaceInvitations(workspaceId);
  const formatedInvitation = invitations.map((i) => ({
    id: i.id,
    status: i.status,
    email: i.email,
    role: i.role,
    expiresAt: i.expires_at,
    createdAt: i.created_at,
  }));

  res
    .status(200)
    .json(new ApiResponse(200, 'Workspace invites', formatedInvitation));
};

export const GetWorkspaceUsers = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { workspaceId } = GetWorkspaceUsersParamsSchema.parse(req.params);

  // Check if user is allowed
  const isMemberOfWorkspace = await getWorkspaceMember(userId, workspaceId);

  if (!isMemberOfWorkspace) {
    throw ApiError.badRequest('You are not part of this workspace');
  }

  const workspaceMembers = await getWorkspaceUsers(workspaceId);

  res
    .status(200)
    .json(new ApiResponse(200, 'Workspace users', workspaceMembers));
};

export const VerifyWorkspaceInvitation = async (
  req: Request,
  res: Response,
) => {
  const { token } = VerifyWorkspaceInvitationParamsSchema.parse(req.params);

  const hashedToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationDetailByHash(hashedToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw ApiError.badRequest('This invitation is no longer valid');
  }

  if (invitation.expires_at < new Date()) {
    // update the status of invitation to 'expired'
    if (invitation.status !== 'expired') {
      await updateInvitationStatus(invitation.id, 'expired');
    }

    throw ApiError.forbidden('Invitation has been expired');
  }

  res.status(200).json(new ApiResponse(200, 'Invitation verified', invitation));
};
