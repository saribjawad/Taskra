import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  AddProjectMembersBodySchema,
  AddProjectMembersParamsSchema,
  CreateProjectSchema,
  GetProjectParamsSchema,
  GetProjectsParamsSchema,
  GetProjectsQuerySchema,
  RemoveProjectMembersBodySchema,
  RemoveProjectMembersParamsSchema,
  UpdateProjectParamsSchema,
  UpdateProjectSchema,
} from '../schemas/projects.schema';
import {
  createProject,
  getProjectByIdAndWorkspaceId,
  getProjectsByWorkspaceId,
  getProjectWithLeadDetails,
  updateProject,
} from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';
import { getProjectMilestones } from '../services/projectMilestones.service';
import { findUserById } from '../services/user.service';
import {
  getWorkspaceById,
  getWorkspaceMember,
} from '../services/workspace.service';
import {
  createProjectMember,
  deleteProjectMember,
  getProjectMemberByIdAndProjectId,
  getProjectMembersWithUserDetail,
} from '../services/projectMembers';

export const GetProject = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = GetProjectParamsSchema.parse(req.params);

  // Check if project exists and is part of workspace
  const project = await getProjectWithLeadDetails(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Get project members
  const [members, milestones] = await Promise.all([
    getProjectMembersWithUserDetail(project.id),
    getProjectMilestones(project.id),
  ]);

  const data = {
    ...project,
    members,
    milestones,
  };

  res
    .status(200)
    .json(new ApiResponse(200, 'Project fetched successfully', data));
};

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

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  let leadUser;
  if (parsedBody.leadId) {
    leadUser = await findUserById(parsedBody.leadId);

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
  }

  // Translate API field names to the database column names used by the service.
  const updatedRowsCount = await updateProject(
    projectId,
    Object.fromEntries(
      Object.entries({
        name: parsedBody.name,
        short_summary: parsedBody.shortSummary,
        description: parsedBody.description,
        priority: parsedBody.priority,
        status: parsedBody.status,
        lead_id: parsedBody.leadId,
        start_date: parsedBody.startDate,
        target_date: parsedBody.targetDate,
      }).filter(([, value]) => value !== undefined),
    ),
  );

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal('Something went wrong while updating the project');
  }

  res.status(200).json(new ApiResponse(200, 'Project updated'));
};

export const GetProjects = async (req: Request, res: Response) => {
  const user = req.user;

  const { limit, page } = GetProjectsQuerySchema.parse(req.query);
  const { workspaceId } = GetProjectsParamsSchema.parse(req.params);

  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  // Check if user is member of the workspace
  const isWorkspaceMember = await getWorkspaceMember(user.id, workspace.id);

  if (!isWorkspaceMember) {
    throw ApiError.forbidden('You do not have access to this workspace');
  }

  const offset = (page - 1) * limit;
  const projects = await getProjectsByWorkspaceId(
    workspace.id,
    limit + 1,
    offset,
  );

  const hasNextPage = projects.length > limit;

  res.status(200).json(
    new ApiResponse(200, 'Projects fetched', {
      metadata: {
        hasNextPage,
        page,
        limit,
        offset,
      },
      projects: projects.slice(0, limit),
    }),
  );
};

export const AddProjectMembers = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = AddProjectMembersParamsSchema.parse(req.params);

  const { memberIds } = AddProjectMembersBodySchema.parse(req.body);

  // Check if project exists
  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const result = {
    added: [] as string[],
    failed: [] as string[],
  };

  // Check if members belong the workspace
  for (const memberId of memberIds) {
    const workspaceMember = await getWorkspaceMember(
      memberId,
      user.activeWorkspace,
    );

    if (!workspaceMember) {
      result.failed.push(memberId);
      continue;
    }

    const projectMember = await createProjectMember(memberId, project.id);

    if (!projectMember) {
      throw ApiError.internal(
        'Something went wrong while creating project member',
      );
    }
    result.added.push(memberId);
  }

  res.status(200).json(new ApiResponse(200, 'Members added', result));
};

export const RemoveProjectMembers = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = RemoveProjectMembersParamsSchema.parse(req.params);
  const { memberIds } = RemoveProjectMembersBodySchema.parse(req.body);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const result = {
    removed: [] as string[],
    failed: [] as string[],
  };

  for (const memberId of memberIds) {
    // Check if project member exists
    const projectMember = await getProjectMemberByIdAndProjectId(
      memberId,
      project.id,
    );

    if (!projectMember) {
      result.failed.push(memberId);
      continue;
    }
    console.log(memberId);

    const rowsCount = await deleteProjectMember(memberId, project.id);

    if (!rowsCount || rowsCount <= 0) {
      throw ApiError.internal(
        'Something went wrong while deleting project member',
      );
    }
    result.removed.push(memberId);
  }

  res.status(200).json(new ApiResponse(200, 'Members removed', result));
};
