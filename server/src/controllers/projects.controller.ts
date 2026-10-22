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
  deleteProject,
  getProjectByIdAndWorkspaceId,
  getProjectsByWorkspaceId,
  getProjectWithLeadDetails,
  getProjectTaskProgress,
} from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';
import { getProjectMilestones } from '../services/projectMilestones.service';
import { findUserById } from '../services/user.service';
import {
  getWorkspaceById,
  getWorkspaceMember,
  getWorkspaceMembers,
} from '../services/workspace.service';
import {
  getProjectMembersByUserIdsAndProjectId,
  getProjectMembersWithUserDetail,
} from '../services/projectMembers';
import { getTasksByProjectId } from '../services/task.service';
import { getProjectActivity } from '../services/projectActivity.service';
import { notifyMemberInWorkspace } from '../websockets/init';
import logger from '../utils/logger';
import {
  addProjectMemberWorkflow,
  createProjectWorkflow,
  removeProjectMemberWorkflow,
  updateProjectWorkflow,
} from '../transactions/project.transactions';
import { getTeamByIdAndWorkspaceId } from '../services/teams.service';

// ==================================================================================
// Helpers
// ==================================================================================

async function requireProject(projectId: string, workspaceId: string) {
  const project = await getProjectByIdAndWorkspaceId(projectId, workspaceId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

// ==================================================================================
// Projects Controllers
// ==================================================================================

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

  const team = await getTeamByIdAndWorkspaceId(
    parsedBody.teamId,
    user.activeWorkspace,
  );
  if (!team) {
    throw ApiError.notFound('Team not found');
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

  const { project } = await createProjectWorkflow({
    user: req.user,
    leadUser: {
      id: leadUser?.id,
    },
    projectPayload: {
      name: parsedBody.name,
      priority: parsedBody.priority,
      status: parsedBody.status,
      workspace_id: user.activeWorkspace,
      team_id: team.id,
      description: parsedBody.description,
      lead_id: leadUser ? leadUser.id : undefined,
      short_summary: parsedBody.shortSummary,
      start_date: parsedBody.startDate,
      target_date: parsedBody.targetDate,
    },
  });

  // Fire websocket notification only after the transactions is successfull
  if (leadUser && leadUser.id && leadUser.id !== user.id) {
    try {
      notifyMemberInWorkspace(leadUser.id, project.workspace_id, {
        type: 'project:lead_assigned',
        message: `You have been assigne as a lead to "${project.name}" project`,
        metaData: {
          actorId: user.id,
          projectId: project.id,
        },
      });
    } catch (e) {
      logger.error('Failed to send real-time notification', e);
    }
  }

  res.status(201).json(new ApiResponse(201, 'Project created', project));
};

export const UpdateProject = async (req: Request, res: Response) => {
  const user = req.user;

  const { projectId } = UpdateProjectParamsSchema.parse(req.params);
  const parsedBody = UpdateProjectSchema.parse(req.body);

  const project = await requireProject(projectId, user.activeWorkspace);

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

  const pendingSocketEvents = await updateProjectWorkflow({
    user,
    leadUser,
    payload,
    project,
  });

  // Send real time notification after the transaction success
  if (leadUser && leadUser.id !== user.id && leadUser.id !== project.lead_id) {
    try {
      notifyMemberInWorkspace(leadUser.id, project.workspace_id, {
        type: 'project:lead_assigned',
        message: `You have been assigne as a lead to '${payload.name ?? project.name}' project`,
        metaData: {
          actorId: user.id,
          projectId: project.id,
        },
      });
    } catch (e) {
      logger.error('Failed to send real-time notification to lead user');
    }
  }

  // Notify lead user and the members on completion
  for (const w of pendingSocketEvents) {
    try {
      notifyMemberInWorkspace(w.userId, w.workspaceId, w.event);
    } catch (e) {
      logger.error('Failed to send real-time notification', e);
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
  const project = await requireProject(projectId, user.activeWorkspace);

  // Get workspace members
  const members = await getWorkspaceMembers(memberIds, user.activeWorkspace);
  const foundIds = new Set(members.map((m) => m.user.id));

  const failed = memberIds.filter((id) => !foundIds.has(id));

  const result = {
    added: [] as string[],
    failed,
  };

  const pendingWebsocketEvents = await addProjectMemberWorkflow({
    user,
    members,
    project,
    result,
  });

  // Send real-time notification to members that they have been added as member
  for (const w of pendingWebsocketEvents) {
    try {
      if (w.userId !== user.id) {
        notifyMemberInWorkspace(w.userId, w.workspaceId, w.event);
      }
    } catch (e) {
      logger.error('Failed to send real-time notifications');
    }
  }

  res.status(200).json(new ApiResponse(200, 'Members added', result));
};

export const RemoveProjectMembers = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = RemoveProjectMembersParamsSchema.parse(req.params);
  const { memberIds } = RemoveProjectMembersBodySchema.parse(req.body);

  const project = await requireProject(projectId, user.activeWorkspace);

  // Only remove users who are currently members of this project.
  const members = await getProjectMembersByUserIdsAndProjectId(
    memberIds,
    project.id,
  );

  const foundIds = new Set(members.map((member) => member.id));

  const failed = memberIds.filter((id) => !foundIds.has(id));

  const result = {
    removed: [] as string[],
    failed,
  };

  await removeProjectMemberWorkflow({
    user,
    members,
    project,
    result,
  });

  res.status(200).json(new ApiResponse(200, 'Members removed', result));
};

export const GetProjectTasks = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 15;

  const { cursorId, cursorTime, milestoneId, status, priority, label } =
    GetProjectTasksQuerySchema.parse(req.query);
  const { projectId } = GetProjectTasksParamsSchema.parse(req.params);

  const project = await requireProject(projectId, user.activeWorkspace);

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
  const project = await requireProject(projectId, user.activeWorkspace);

  const progress = await getProjectTaskProgress(project.id);
  res.status(200).json(new ApiResponse(200, 'Project progress', progress));
};

export const DeleteProject = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = DeleteProjectParamsSchema.parse(req.params);

  const project = await requireProject(projectId, user.activeWorkspace);

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

  const project = await requireProject(projectId, user.activeWorkspace);

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
    username: p.username,
    content: p.content,
    activityType: p.activity_type,
    type: p.type,
    metadata: p.metadata,
    description: p.description,
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
