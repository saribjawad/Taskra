import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { CreateTeamBodySchema } from '../schemas/teams.schema';
import { createTeam, getTeamsByWorkspaceId } from '../services/teams.service';
import { ApiError } from '../utils/ApiErrors';
import { createTeamMember } from '../services/teamMembers.service';

export const CreateTeam = async (req: Request, res: Response) => {
  const user = req.user;
  const { identifier, name, description } = CreateTeamBodySchema.parse(
    req.body,
  );

  const createdTeam = await createTeam(
    user.activeWorkspace,
    name,
    identifier,
    description,
  );

  if (!createdTeam) {
    throw ApiError.internal('Something went wrong while creating the team');
  }

  // Create team member
  const createdTeamMember = createTeamMember(user.id, createdTeam.id);

  if (!createdTeamMember) {
    throw ApiError.internal(
      'Something went wrong while creating the team member',
    );
  }

  res.status(201).json(new ApiResponse(200, 'Team created'));
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
