import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  CreateTeamBodySchema,
  CreateTeamMemberBodySchema,
  TeamIdParamsSchema,
  TeamMemberParamsSchema,
} from '../schemas/teams.schema';
import { ApiError } from '../utils/ApiErrors';
import {
  createTeamMember,
  createTeamMembers,
  deleteTeamMember,
  getTeamMember,
  getTeamMembers,
  getTeamMembersByUserIds,
  getTeamMembersCount,
} from '../services/teamMembers.service';
import {
  createTeam,
  deleteTeam,
  getTeamByIdAndWorkspaceId,
  getTeamDocumentCount,
  getTeamLinkCount,
  getTeamsCountByWorkspaceId,
  getTeamsByWorkspaceId,
} from '../services/teams.service';
import { getWorkspaceMembers } from '../services/workspace.service';

// ==================================================================================
// Team Controllers
// ==================================================================================

export const CreateTeam = async (req: Request, res: Response) => {
  const user = req.user;
  const { identifier, name, description } = CreateTeamBodySchema.parse(
    req.body,
  );

  const createdTeam = await createTeam({
    workspaceId: user.activeWorkspace,
    name,
    identifier,
    description,
  });

  if (!createdTeam) {
    throw ApiError.internal('Something went wrong while creating the team');
  }

  // Create team member
  const createdTeamMember = await createTeamMember({
    userId: user.id,
    teamId: createdTeam.id,
  });

  if (!createdTeamMember) {
    throw ApiError.internal(
      'Something went wrong while creating the team member',
    );
  }

  res.status(201).json(new ApiResponse(200, 'Team created'));
};

export const GetTeamMembers = async (req: Request, res: Response) => {
  const { teamId } = TeamIdParamsSchema.parse(req.params);
  const team = await getTeamByIdAndWorkspaceId(
    teamId,
    req.user.activeWorkspace,
  );
  if (!team) throw ApiError.notFound('Team not found');

  const members = await getTeamMembers(team.id);
  const formattedMembers = members.map((member) => ({
    id: member.user_id,
    teamMemberId: member.id,
    username: member.username,
    fullName: member.full_name,
    email: member.email,
    joinedAt: member.created_at,
  }));

  res
    .status(200)
    .json(new ApiResponse(200, 'Team members fetched', formattedMembers));
};

export const AddTeamMember = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = TeamIdParamsSchema.parse(req.params);
  const { memberIds } = CreateTeamMemberBodySchema.parse(req.body);

  const team = await getTeamByIdAndWorkspaceId(teamId, user.activeWorkspace);

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  const workspaceMembers = await getWorkspaceMembers(
    uniqueMemberIds,
    user.activeWorkspace,
  );

  const validIds = new Set(workspaceMembers.map((member) => member.user.id));
  const validMemberIds = uniqueMemberIds.filter((id) => validIds.has(id));

  const failed = uniqueMemberIds.filter((id) => !validIds.has(id));

  const existingMembers = await getTeamMembersByUserIds(
    validMemberIds,
    team.id,
  );

  const existingIds = new Set(existingMembers.map((member) => member.user_id));
  const newMemberIds = validMemberIds.filter((id) => !existingIds.has(id));

  const createdMembers = newMemberIds.length
    ? await createTeamMembers(newMemberIds, team.id)
    : [];

  res.status(201).json(
    new ApiResponse(201, 'Team members added', {
      added: createdMembers.map((member) => member.user_id),
      alreadyAdded: [...existingIds],
      failed,
    }),
  );
};

export const RemoveTeamMember = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, memberId } = TeamMemberParamsSchema.parse(req.params);

  const team = await getTeamByIdAndWorkspaceId(teamId, user.activeWorkspace);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  const member = await getTeamMember(memberId, team.id);
  if (!member) {
    throw ApiError.notFound('Team member not found');
  }

  const memberCount = await getTeamMembersCount(team.id);
  if (memberCount <= 1) {
    throw ApiError.conflict('Cannot remove the last member of a team');
  }

  const deletedRows = await deleteTeamMember(memberId, team.id);
  if (!deletedRows) {
    throw ApiError.notFound('Team member not found');
  }

  res.status(200).json(new ApiResponse(200, 'Team member removed'));
};

export const DeleteTeam = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = TeamIdParamsSchema.parse(req.params);
  const team = await getTeamByIdAndWorkspaceId(teamId, user.activeWorkspace);
  if (!team) throw ApiError.notFound('Team not found');

  const teamCount = await getTeamsCountByWorkspaceId(user.activeWorkspace);
  if (teamCount <= 1) {
    throw ApiError.conflict('Cannot delete the last team in a workspace');
  }

  const [documentCount, linkCount] = await Promise.all([
    getTeamDocumentCount(team.id),
    getTeamLinkCount(team.id),
  ]);

  if (documentCount > 0 || linkCount > 0) {
    throw ApiError.conflict(
      'Remove the team documents and links before deleting this team',
    );
  }

  const deletedRows = await deleteTeam(team.id, user.activeWorkspace);
  if (!deletedRows) throw ApiError.notFound('Team not found');

  res.status(200).json(new ApiResponse(200, 'Team deleted'));
};

export const GetWorkspaceTeams = async (req: Request, res: Response) => {
  const user = req.user;
  const teams = await getTeamsByWorkspaceId(user.activeWorkspace);

  const formatedTeams = teams?.map((t) => ({
    id: t.id,
    name: t.name,
    identifier: t.identifier,
    description: t.description,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  res.status(200).json(new ApiResponse(200, 'Workspace teams', formatedTeams));
};
