import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  CreateProjectSchema,
  UpdateProjectParamsSchema,
  UpdateProjectSchema,
} from '../schemas/projects.schema';
import {
  createProject,
  getProjectById,
  updateProject,
} from '../services/projects.service';
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

export const UpdateProject = async (req: Request, res: Response) => {
  const user = req.user;

  const { projectId } = UpdateProjectParamsSchema.parse(req.params);
  const parsedBody = UpdateProjectSchema.parse(req.body);

  const project = await getProjectById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.workspace_id !== user.activeWorkspace) {
    throw ApiError.forbidden('You do not have access to this project');
  }

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

  const updatedRowsCount = await updateProject(projectId, parsedBody);

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal('Something went wrong while updating the project');
  }

  res.status(200).json(new ApiResponse(200, 'Project updated'));
};
