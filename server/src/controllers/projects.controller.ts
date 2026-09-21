import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { CreateProjectSchema } from '../schemas/projects.schema';
import { createProject } from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';
import { findUserById } from '../services/user.service';
import { getWorkspaceMember } from '../services/workspace.service';

export const CreateProject = async (req: Request, res: Response) => {
  const user = req.user;
  const parsedBody = CreateProjectSchema.parse(req.body);

  let leadUser;
  if (parsedBody.leadId) {
    leadUser = await findUserById(parsedBody.leadId);
  }

  if (!leadUser) {
    throw ApiError.notFound('Lead user not found');
  }

  const isLeadUserMember = await getWorkspaceMember(
    leadUser.id,
    user.activeWorkspace,
  );

  if (!isLeadUserMember) {
    throw ApiError.forbidden('Lead is not member of this workspace');
  }

  const createdProject = await createProject({
    name: parsedBody.name,
    priority: parsedBody.priority,
    status: parsedBody.status,
    workspace_id: user.activeWorkspace,
    description: parsedBody.description,
    lead_id: leadUser.id,
    short_summary: parsedBody.shortSummary,
    start_date: parsedBody.startDate,
    target_date: parsedBody.targetDate,
  });

  if (!createdProject) {
    throw ApiError.internal('Something went wrong while creating the project');
  }

  res.status(201).json(new ApiResponse(201, 'Project created'));
};
