import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createWorkspace,
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
  GetPendingWorkspaceInvitesSchema,
  ResendWorkspaceInviteParamsSchema,
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
  getInvitationById,
  getInvitationDetailByHash,
  getPendingInvitationByEmail,
  getPendingInvitations,
  getWorkspaceInvitations,
  renewInvitation,
  updateInvitationStatus,
} from '../services/invitation.service';
import { sendInviteToWorkspace } from '../lib/resend';
import { env } from '../config/env';
import { WorkspaceMemberRole } from '../models/workspace.model';
import { notifyMemberInWorkspace } from '../websockets/init';
import {
  getCompletionTrend,
  getDashboardSummary,
  getOverdueTasks,
  getTaskStatusBreakdown,
  getUpcomingDeadlines,
} from '../services/dashboard.service';
import { createTeam } from '../services/teams.service';
import { createTeamMember } from '../services/teamMembers.service';
import {
  acceptWorkspaceInviteFlow,
  createWorkspaceWorkflow,
  declineWorkspaceInviteFlow,
} from '../transactions/workspace.transactions';

// ==================================================================================
// Workspace Controllers
// ==================================================================================

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

  const updatedRowCount = await updateUser({
    id: user.id,
    active_workspace: workspaceId,
  });

  if (updatedRowCount && updatedRowCount < 0) {
    throw ApiError.internal('Something went wrong while switching workspace');
  }

  const accessToken = generateAccessToken(
    user.id,
    user.email,
    (user.activeWorkspace = workspaceId),
    workspaceMember.role,
    user.fullName,
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    (user.activeWorkspace = workspaceId),
    workspaceMember.role,
    user.fullName,
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

  const { workspace, workspaceMember } = await createWorkspaceWorkflow({
    user,
    workspaceName: name,
  });

  const accessToken = generateAccessToken(
    user.id,
    user.email,
    workspace.id,
    workspaceMember.role,
    user.fullName,
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    workspace.id,
    workspaceMember.role,
    user.fullName,
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
      null,
      user.fullName,
    );
    const refreshToken = await generateRefreshToken(
      user.id,
      user.email,
      (user.activeWorkspace = ''),
      null,
      user.fullName,
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

  const updatedUser = await updateUser({
    id: user.id,
    active_workspace: newActiveWorkspaceId,
  });

  if (!updatedUser) {
    throw ApiError.internal(
      'Something went wrong while updating user active workspace',
    );
  }

  // Get role of the user in new active workspace
  const workspaceMember = await getWorkspaceMember(
    user.id,
    newActiveWorkspaceId,
  );

  if (!workspaceMember) {
    throw ApiError.notFound('Workspace member not found');
  }
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    (user.activeWorkspace = newActiveWorkspaceId),
    workspaceMember.role,
    user.fullName,
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    (user.activeWorkspace = newActiveWorkspaceId),
    workspaceMember.role,
    user.fullName,
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

  const userWorkspaces = await getUserWorkspaces(user.id);

  const newActiveWorkspaceId = userWorkspaces[0]?.id;

  const updatedUser = await updateUser({
    id: user.id,
    active_workspace: newActiveWorkspaceId ?? null,
  });

  if (!updatedUser) {
    throw ApiError.internal(
      'Something went wrong while updating user active workspace',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Workspace member deleted'));
};

export const InviteToWorkspace = async (req: Request, res: Response) => {
  const { workspaceId } = InviteToWorkspaceParamsSchema.parse(req.params);
  const { emails, role } = InviteToWorkspaceSchema.parse(req.body);
  const userId = req.user.id;

  const user = await findUserById(userId);
  const workspace = await getWorkspaceById(workspaceId);

  const response: Record<string, any> = {
    invited: [],
    alreadyMembers: [],
    alreadyInvited: [],
    failedToCreate: [],
    failedToSend: [],
  };

  // Loop over array of emails
  for (const email of emails) {
    // If user exists check
    const userToBeInvited = await findUserByEmail(email);

    if (userToBeInvited) {
      // Check if user is already member of workspace
      const userWorkspaceMembership = await getWorkspaceMember(
        userToBeInvited.id,
        workspaceId,
      );
      if (userWorkspaceMembership) {
        response.alreadyMembers.push(
          `Person with ${email} is already member of this workspace`,
        );
        continue;
      }
    }

    const existingInvite = await getPendingInvitationByEmail(
      email,
      workspaceId,
    );

    // TODO: enforce this at the database level too.
    if (existingInvite) {
      response.alreadyInvited.push(`${email} already invited`);
      continue;
    }

    // Create token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.hash('SHA-256', token);

    // Expiry date of 15 minutes
    const currentTimeAsMs = Date.now();
    const adjustedTimeAsMs = currentTimeAsMs + 15 * 60 * 1000;
    const expiryDate = new Date(adjustedTimeAsMs);

    // Create and save invitation
    const invitation = await createInvitation(
      email,
      role as WorkspaceMemberRole,
      userId,
      workspaceId,
      hashedToken,
      expiryDate,
    );

    if (!invitation) {
      response.failedToCreate.push(
        `Something went wrong while creating the invitation for ${email}`,
      );
      continue;
    }

    const invitationLink = `${env.APP_URL}/invite?token=${token}`;

    // Send the email to the user
    try {
      await sendInviteToWorkspace(
        user.username,
        workspace.name,
        invitationLink,
        email,
      );

      response.invited.push(`Invitation has been sent to ${email}`);
    } catch (error) {
      // Delete the created invitation
      await deleteInvitation(invitation.id);

      response.failedToSend.push(
        `Something went wrong while sending invitation to ${email}`,
      );
    }
  }

  res
    .status(201)
    .json(new ApiResponse(201, 'Invitations has been sent', response));
};

export const AcceptWorkspaceInvite = async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  const { token } = AcceptWorkspaceInviteParamsSchema.parse(req.params);

  const user = await findUserById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const hashedToken = crypto.hash('SHA-256', token);

  const invitation = await getInvitationByHash(hashedToken);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (user.email !== invitation.email) {
    throw ApiError.forbidden(
      'This invitation was sent to a different email address',
    );
  }

  const existingMembership = await getWorkspaceMember(
    user.id,
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
    await updateInvitationStatus({
      id: invitation.id,
      status: 'expired',
    });
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been expired'));
  }

  const workspaceToJoin = await getWorkspaceById(invitation.workspace_id);

  if (!workspaceToJoin) {
    throw ApiError.notFound('Workspace not found');
  }

  const member = await acceptWorkspaceInviteFlow({ invitation, user });

  const accessToken = generateAccessToken(
    user.id,
    user.email,
    member.workspace_id,
    member.role,
    user.full_name,
  );
  const refreshToken = await generateRefreshToken(
    user.id,
    user.email,
    member.workspace_id,
    member.role,
    user.full_name,
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

  // Send the real-time notification after the transaction commits.
  if (invitation.sent_by) {
    notifyMemberInWorkspace(invitation.sent_by, invitation.workspace_id, {
      type: 'invite:accepted',
      message: `The invite you sent to ${user.email} has been accepted`,
      metaData: {
        actorId: user.id,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, 'Invite accepted'));
};

export const DeclineWorkspaceInvite = async (req: Request, res: Response) => {
  const user = req.user;
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
    await updateInvitationStatus({
      id: invitation.id,
      status: 'expired',
    });
    return res
      .status(200)
      .json(new ApiResponse(200, 'Invitation has been expired'));
  }

  await declineWorkspaceInviteFlow({
    invitation,
    user,
  });

  // Notify sender
  if (invitation.sent_by) {
    notifyMemberInWorkspace(invitation.sent_by, invitation.workspace_id, {
      type: 'invite:declined',
      message: `The invite you sent to ${user.email} has been declined`,
      metaData: {
        actorId: user.id,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, 'Workspace invite declined'));
};

export const RevokeWorkspaceInvite = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { invitationId } = RevokeWorkspaceInviteParamsSchema.parse(req.params);

  const invitation = await getInvitationById(invitationId);

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
  const updatedRows = await updateInvitationStatus({
    id: invitation.id,
    status: 'revoked',
  });

  if (!updatedRows || updatedRows < 1) {
    throw ApiError.internal(
      'Something went wrong while updating the invitation status',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Workspace invite revoked'));
};

export const ResendWorkspaceInvite = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { invitationId } = ResendWorkspaceInviteParamsSchema.parse(req.params);

  const invitation = await getInvitationById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (!['pending', 'expired'].includes(invitation.status)) {
    throw ApiError.badRequest(
      'Only pending or expired invitations can be resent',
    );
  }

  const user = await findUserById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const workspace = await getWorkspaceById(invitation.workspace_id);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  // Check if the user is part of the workspace
  const workspaceMember = await getWorkspaceMember(
    userId,
    invitation.workspace_id,
  );

  if (!workspaceMember) {
    throw ApiError.forbidden('You are not allowed to resend this invitation');
  }

  // Create token
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.hash('SHA-256', token);

  // Expiry date of 15 minutes
  const currentTimeAsMs = Date.now();
  const adjustedTimeAsMs = currentTimeAsMs + 15 * 60 * 1000;
  const expiryDate = new Date(adjustedTimeAsMs);

  // Renew invitation
  const updatedRowsCount = await renewInvitation(
    invitation.id,
    hashedToken,
    expiryDate,
  );

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal(
      'Something went wrong while updating the invitation',
    );
  }

  // Send the email to the user
  try {
    const invitationLink = `${env.APP_URL}/invite?token=${token}`;
    await sendInviteToWorkspace(
      user.username,
      workspace.name,
      invitationLink,
      user.email,
    );
  } catch (error) {
    throw ApiError.internal(
      'Something went wrong while sending invitation email',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Resent the invitation'));
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

export const GetWorkspaceDashboard = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { workspaceId } = GetWorkspaceUsersParamsSchema.parse(req.params);
  const membership = await getWorkspaceMember(userId, workspaceId);

  if (!membership) {
    throw ApiError.forbidden(
      'You have been removed from this workspace. Please contact the workspace owner if you think this is a mistake.',
      'WORKSPACE_ACCESS_REMOVED',
    );
  }

  const [
    summary,
    completionTrend,
    overdueTasks,
    upcomingDeadlines,
    taskStatusBreakdown,
  ] = await Promise.all([
    getDashboardSummary(workspaceId),
    getCompletionTrend(workspaceId),
    getOverdueTasks(workspaceId),
    getUpcomingDeadlines(workspaceId),
    getTaskStatusBreakdown(workspaceId),
  ]);

  const dashboard = {
    summary,
    completionTrend,
    overdueTasks,
    upcomingDeadlines,
    taskStatusBreakdown,
  };

  res.status(200).json(new ApiResponse(200, 'Workspace dashboard', dashboard));
};

export const GetPendingWorkspaceInvites = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user.id;
  const { workspaceId } = GetPendingWorkspaceInvitesSchema.parse(req.params);

  const isWorkspaceMember = await getWorkspaceMember(userId, workspaceId);
  if (!isWorkspaceMember) {
    throw ApiError.badRequest('You are not member of this workspace');
  }

  const pendingInvites = await getPendingInvitations(workspaceId);

  res
    .status(200)
    .json(new ApiResponse(200, 'Pending workspace invites', pendingInvites));
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
      await updateInvitationStatus({
        id: invitation.id,
        status: 'expired',
      });
    }

    throw ApiError.forbidden('Invitation has been expired');
  }

  res.status(200).json(new ApiResponse(200, 'Invitation verified', invitation));
};
