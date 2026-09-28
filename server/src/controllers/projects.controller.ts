import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  AddProjectMembersBodySchema,
  AddProjectMembersParamsSchema,
  CreateProjectSchema,
  GetProjectTasksParamsSchema,
  GetProjectTasksQuerySchema,
  GetProjectParamsSchema,
  GetProjectsParamsSchema,
  GetProjectsQuerySchema,
  RemoveProjectMembersBodySchema,
  RemoveProjectMembersParamsSchema,
  UpdateProjectParamsSchema,
  UpdateProjectSchema,
  DeleteProjectParamsSchema,
  GetProjectActivityParamsSchema,
  GetProjectActivityQuery,
} from '../schemas/projects.schema';
import {
  createProject,
  deleteProject,
  getProjectByIdAndWorkspaceId,
  getProjectsByWorkspaceId,
  getProjectWithLeadDetails,
  getProjectTaskProgress,
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
import { getTasksByProjectId } from '../services/task.service';
import {
  createProjectActivity,
  getProjectActivity,
} from '../services/projectActivity.service';
import { Project, ProjectPriorityType } from '../models/projects.model';
import { ProjectActivityType } from '../models/projectActivity.model';

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

  // Create project activity
  const createdProjectActivity = await createProjectActivity(
    createdProject.id,
    user.id,
    `${user.email} created the project.`,
    'project_created',
  );

  if (!createdProjectActivity) {
    throw ApiError.internal(
      'Something went wrong while creating project activity',
    );
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
  const payload = Object.fromEntries(
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
  );

  const updatedRowsCount = await updateProject(projectId, payload);

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal('Something went wrong while updating the project');
  }

  const activityMap = {
    name: 'project_updated',
    short_summary: 'project_updated',
    description: 'project_updated',
    lead_id: 'lead_changed',
    priority: 'priority_changed',
    status: 'status_changed',
    start_date: 'start_date_changed',
    target_date: 'end_date_changed',
  };

  // Create project activities
  for (const [field, activityType] of Object.entries(activityMap)) {
    if (
      payload[field] !== undefined &&
      payload[field] !== project[field as keyof Project]
    ) {
      let description = `${user.email} changed ${field} to ${payload[field]}`;

      // Manually add lead email
      if (field === 'lead_id') {
        description = `${user.email} changed lead to ${leadUser?.email}`;
      }

      const createdProjectActivity = await createProjectActivity(
        project.id,
        user.id,
        description,
        activityType as ProjectActivityType,
        {
          field,
          from: String(project[field as keyof Project] ?? ''),
          to: String(payload[field] ?? ''),
        },
      );

      if (!createdProjectActivity) {
        throw ApiError.internal(
          'Something went wrong while creating project activity',
        );
      }
    }
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

  // TODO: instead of looping fetching all the members in single query
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
    } else {
      // Create project activity
      const createdProjectActivity = await createProjectActivity(
        project.id,
        user.id,
        // TEMP:
        // TODO: return user detail from workspace member and use it
        `${user.email} added ${memberId} as member`,
        'member_added',
      );

      if (!createdProjectActivity) {
        throw ApiError.internal(
          'Something went wrong while creating project activity',
        );
      }
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

  // TODO: instead of looping fetching all the members in single query
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

    const rowsCount = await deleteProjectMember(memberId, project.id);

    if (!rowsCount || rowsCount <= 0) {
      throw ApiError.internal(
        'Something went wrong while deleting project member',
      );
    } else {
      // Create project activity
      const createdProjectActivity = await createProjectActivity(
        project.id,
        user.id,
        // TEMP:
        // TODO: return user detail from workspace member and use it
        `${user.email} removed ${memberId} from member`,
        'member_removed',
      );

      if (!createdProjectActivity) {
        throw ApiError.internal(
          'Something went wrong while creating project activity',
        );
      }
    }

    result.removed.push(memberId);
  }

  res.status(200).json(new ApiResponse(200, 'Members removed', result));
};

export const GetProjectTasks = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 15;

  const { cursorId, cursorTime, milestoneId, status, priority, label } =
    GetProjectTasksQuerySchema.parse(req.query);
  const { projectId } = GetProjectTasksParamsSchema.parse(req.params);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const tasks = await getTasksByProjectId(
    project.id,
    LIMIT + 1,
    milestoneId,
    cursorTime,
    cursorId,
    status,
    priority,
    label,
  );

  const hasMore = tasks.length > LIMIT;
  const projectTasks = hasMore ? tasks.slice(0, LIMIT) : tasks;

  // Keep the exact database timestamp; converting it to Date loses microseconds.
  const cursor = hasMore
    ? {
        time: projectTasks[projectTasks.length - 1].cursor_time,
        id: projectTasks[projectTasks.length - 1].id,
      }
    : null;

  const formattedTasks = projectTasks.map((n) => ({
    id: n.id,
    title: n.title,
    status: n.status,
    priority: n.priority,
    label: n.label,
    workspaceId: n.workspace_id,
    projectId: n.project_id,
    milestoneId: n.project_milestone_id,
    updatedAt: n.updated_at,
    createdAt: n.created_at,
  }));

  res.status(200).json(
    new ApiResponse(200, 'Project tasks', {
      tasks: formattedTasks,
      hasMore,
      cursor,
    }),
  );
};

export const GetProjectProgress = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = GetProjectParamsSchema.parse(req.params);
  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const progress = await getProjectTaskProgress(project.id);
  res.status(200).json(new ApiResponse(200, 'Project progress', progress));
};

export const DeleteProject = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = DeleteProjectParamsSchema.parse(req.params);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const deleteProjectRowCount = await deleteProject(project.id);

  if (!deleteProjectRowCount || deleteProjectRowCount <= 0) {
    throw ApiError.internal('Something went wrong while deleting the project');
  }

  res.status(200).json(new ApiResponse(200, 'Project deleted'));
};

export const GetProjectActivity = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 20;

  const { cursorId, cursorTime } = GetProjectActivityQuery.parse(req.query);
  const { projectId } = GetProjectActivityParamsSchema.parse(req.params);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const projectActivities = await getProjectActivity(
    project.id,
    LIMIT + 1,
    cursorId,
    cursorTime,
  );

  const hasMore = projectActivities.length > LIMIT;
  const pageProjectActivities = hasMore
    ? projectActivities.slice(0, LIMIT)
    : projectActivities;

  const cursor = hasMore
    ? {
        time: pageProjectActivities[pageProjectActivities.length - 1]
          .created_at,
        id: pageProjectActivities[pageProjectActivities.length - 1].id,
      }
    : null;

  const formattedPageProjectActivities = pageProjectActivities.map((p) => ({
    id: p.id,
    projectId: p.project_id,
    userId: p.user_id,
    type: p.type,
    description: p.description,
    metadata: p.metadata,
    updatedAt: p.updated_at,
    createdAt: p.created_at,
  }));

  res.status(200).json(
    new ApiResponse(200, 'Project activty', {
      projectActivities: formattedPageProjectActivities,
      hasMore,
      cursor,
    }),
  );
};
