import { Request, Response } from 'express';
import {
  ConnectTaskToProjectBodySchema,
  ConnectTaskToProjectParamsSchema,
  CreateTaskSchema,
  GetTaskActivityParamsSchema,
  GetTaskActivityQuerySchema,
  GetTaskQuerySchema,
  MarkTaskAsCompletedParamsSchema,
  TaskParamsSchema,
  UpdateTaskSchema,
} from '../schemas/task.schema';
import { findUserById } from '../services/user.service';
import { ApiError } from '../utils/ApiErrors';
import {
  deleteTask,
  findTaskByIdAndWorkspaceId,
  getTasks,
} from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import {
  getAttachmentByIdAndTaskId,
  getAttachmentsByTaskId,
} from '../services/attachment.service';
import { getTaskActivitiesByTaskId } from '../services/taskActivity.service';
import { TaskActivityType } from '../models/taskActivity.model';
import { notifyMemberInWorkspace } from '../websockets/init';
import { getWorkspaceMember } from '../services/workspace.service';
import { isObjectEmpty } from '../utils/isObjectEmpty';
import { getProjectByIdAndWorkspaceId } from '../services/projects.service';
import { getProjectMilestonesWithIdAndProjectId } from '../services/projectMilestones.service';
import {
  connectTaskToProjectWorkflow,
  createTaskWorkflow,
  markTaskAsCompletedWorkflow,
  updateTaskWorkflow,
} from '../transactions/tasks.transactions';
import logger from '../utils/logger';
import { getTeamByIdAndWorkspaceId } from '../services/teams.service';
import { requireTeamWriteAccess } from '../utils/requireTeamWriteAccess';

// ==================================================================================
// Helpers
// ==================================================================================

async function requireTask(taskId: string, workspaceId: string) {
  const task = await findTaskByIdAndWorkspaceId(taskId, workspaceId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  return task;
}

// ==================================================================================
// Task Controllers
// ==================================================================================

export const CreateTask = async (req: Request, res: Response) => {
  const user = req.user;
  const activeWorkspace = req.user.activeWorkspace;

  const parsedBody = CreateTaskSchema.parse({
    body: req.body,
    files: req.files,
  });

  const { body } = parsedBody;
  const {
    description,
    teamId,
    label,
    priority,
    status,
    title,
    dueDate,
    startDate,
    assignee: assigneeId,
    reporter: reporterId,
  } = body;

  const team = await getTeamByIdAndWorkspaceId(teamId, activeWorkspace);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }
  await requireTeamWriteAccess(user.id, user.role, team.id);

  let assigneeMember;
  let reporterMember;

  // If the assigne exists query the user
  if (assigneeId) {
    assigneeMember = await getWorkspaceMember(assigneeId, activeWorkspace);
    if (!assigneeMember) {
      throw ApiError.notFound('Assignee not found');
    }
  }

  if (reporterId) {
    reporterMember = await getWorkspaceMember(reporterId, activeWorkspace);
    if (!reporterMember) {
      throw ApiError.notFound('Reporter not found');
    }
  }

  const files = Object.values(req.files ?? {}).flat();

  const { task } = await createTaskWorkflow({
    user: user,
    assigneeMember,
    reporterMember,
    files,
    payload: {
      title,
      description,
      status,
      priority,
      label,
      activeWorkspace,
      teamId: team.id,
      userId: user.id,
      startDate,
      dueDate,
      assignee: assigneeMember ? assigneeMember.user_id : null,
      reporter: reporterMember ? reporterMember.user_id : null,
    },
  });

  if (assigneeMember && assigneeMember.user_id !== user.id) {
    try {
      notifyMemberInWorkspace(assigneeMember.user_id, task.workspace_id, {
        type: 'task:assigned',
        message: 'A task has been assigned to you',
        metaData: {
          actorId: user.id,
          taskId: task.id,
        },
      });
    } catch (e) {
      logger.error('Failed to send real-time notification to assignee', e);
    }
  }

  if (
    reporterMember &&
    reporterMember.user_id !== user.id &&
    reporterMember.user_id !== assigneeMember?.user_id
  ) {
    try {
      notifyMemberInWorkspace(reporterMember.user_id, task.workspace_id, {
        type: 'task:reporter_assigned',
        message: 'You were assigned as the reporter of a task',
        metaData: {
          actorId: user.id,
          taskId: task.id,
        },
      });
    } catch (e) {
      logger.error('Failed to send real-time notification to reporter', e);
    }
  }

  res.status(201).json(
    new ApiResponse(201, 'Task created', {
      ...task,
      team: { id: team.id, name: team.name },
    }),
  );
};

export const UpdateTask = async (req: Request, res: Response) => {
  const user = req.user;

  const parsedParams = TaskParamsSchema.parse(req.params);

  const { taskId } = parsedParams;
  const { body } = UpdateTaskSchema.parse({
    body: req.body,
    files: req.files,
  });

  const { clearFields, removedAttachmentIds } = body;

  const task = await requireTask(taskId, user.activeWorkspace);

  const { assignee: assigneeId, reporter: reporterId } = body;

  let assigneeUser;
  let reporterUser;

  if (
    (assigneeId && clearFields.includes('assignee')) ||
    (reporterId && clearFields.includes('reporter'))
  ) {
    throw ApiError.badRequest('Cannot set and clear the same field');
  }

  if (assigneeId) {
    const isAssigneeMember = await getWorkspaceMember(
      assigneeId,
      user.activeWorkspace,
    );

    if (!isAssigneeMember) {
      throw ApiError.forbidden('Assignee is not member of this workspace');
    }

    assigneeUser = await findUserById(isAssigneeMember.user_id);

    if (!assigneeUser) {
      throw ApiError.notFound('Assignee not found');
    }
  }
  if (reporterId) {
    const isReporterMember = await getWorkspaceMember(
      reporterId,
      user.activeWorkspace,
    );
    if (!isReporterMember) {
      throw ApiError.forbidden('Reporter is not member of this workspace');
    }

    reporterUser = await findUserById(isReporterMember.user_id);

    if (!reporterUser) {
      throw ApiError.notFound('Reporter not found');
    }
  }

  const fieldMap: Record<string, string> = {
    startDate: 'start_date',
    dueDate: 'due_date',
  };

  const payload: Record<string, unknown> = {};

  Object.entries(body).forEach(([key, value]) => {
    if (value != null && !Array.isArray(value)) {
      payload[fieldMap[key] ?? key] = value;
    }
  });

  clearFields.forEach((field) => {
    payload[field] = null;
  });

  const files = Object.values(req.files ?? {}).flat();
  const removedAttachments = await Promise.all(
    removedAttachmentIds.map(async (attachmentId) => {
      const attachment = await getAttachmentByIdAndTaskId(
        attachmentId,
        task.id,
      );

      if (!attachment) {
        throw ApiError.notFound('Attachment not found');
      }

      return attachment;
    }),
  );

  if (
    !isObjectEmpty(payload) ||
    files.length > 0 ||
    removedAttachments.length > 0
  ) {
    await updateTaskWorkflow({
      user,
      task,
      payload,
      assigneeUser,
      reporterUser,
      files,
      removedAttachments,
    });
  }

  // Notify the assignee if the actor himself is not the assignee
  if (assigneeUser && assigneeUser.id !== user.id) {
    notifyMemberInWorkspace(assigneeUser.id, task.workspace_id, {
      type: 'task:assigned',
      message: 'A task has been assigned to you',
      metaData: {
        actorId: user.id,
        taskId: task.id,
      },
    });
  }

  // Notify the reporter if the actor himself is not the reporter
  if (
    reporterUser &&
    reporterUser.id !== user.id &&
    reporterUser.id !== assigneeUser?.id
  ) {
    notifyMemberInWorkspace(reporterUser.id, task.workspace_id, {
      type: 'task:reporter_assigned',
      message: 'You were assigned as the reporter of a task',
      metaData: {
        actorId: user.id,
        taskId: task.id,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, 'Task updated'));
};

export const MarkTaskAsCompleted = async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId } = MarkTaskAsCompletedParamsSchema.parse(req.params);

  const task = await requireTask(taskId, user.activeWorkspace);

  const notificationRecipients = await markTaskAsCompletedWorkflow({
    task,
    user,
    completedDate: new Date(),
  });

  // Notify the assignee and the reporter - Don't notify if the assignee or reporter himself is the actor
  for (const recipient of notificationRecipients) {
    notifyMemberInWorkspace(recipient, task.workspace_id, {
      type: 'task:completed',
      message: 'Task has been marked as completed',
      metaData: {
        taskId: task.id,
        actorId: user.id,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, 'Task marked as completed'));
};

export const GetTasks = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const workspaceId = req.user.activeWorkspace;
  const parsedQueries = GetTaskQuerySchema.parse(req.query);

  const { page, limit, label, priority, status, search, filter } =
    parsedQueries;
  const offset = (page - 1) * limit;

  // Adding one to check will there be a next page
  const tasks = await getTasks(
    limit + 1,
    workspaceId,
    offset,
    status,
    label,
    priority,
    search,
    userId,
    filter,
  );

  const hasNextPage = tasks.length > limit;

  res.status(200).json(
    new ApiResponse(200, 'Tasks fetched', {
      metadata: {
        hasNextPage,
        page,
        limit,
        offset,
      },
      tasks: tasks.slice(0, limit),
    }),
  );
};

export const GetTask = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParam = TaskParamsSchema.parse(req.params);
  const { taskId } = parsedParam;

  const task = await requireTask(taskId, workspaceId);
  const team = await getTeamByIdAndWorkspaceId(task.team_id, workspaceId);

  // Get assignee & reporter details
  const assignee = await findUserById(task.assignee);
  const reporter = await findUserById(task.reporter);

  // Get task attachments
  let attachments = await getAttachmentsByTaskId(taskId);

  return res.status(200).json(
    new ApiResponse(200, 'success', {
      ...task,
      team: { id: team.id, name: team.name },
      attachments: attachments,
      // In case of no assignee
      ...(assignee
        ? {
            assignee: {
              id: assignee?.id ?? '',
              username: assignee?.username ?? '',
              email: assignee?.email ?? '',
            },
          }
        : {
            assignee: null,
          }),
      ...(reporter
        ? {
            reporter: {
              id: reporter?.id ?? '',
              username: reporter?.username ?? '',
              email: reporter?.email ?? '',
            },
          }
        : {
            reporter: null,
          }),
    }),
  );
};

export const GetTaskTeamProject = async (req: Request, res: Response) => {
  const { taskId } = TaskParamsSchema.parse(req.params);
  const task = await requireTask(taskId, req.user.activeWorkspace);
  const team = await getTeamByIdAndWorkspaceId(
    task.team_id,
    req.user.activeWorkspace,
  );

  res.status(200).json(
    new ApiResponse(200, 'Task team and project fetched', {
      teamId: task.team_id,
      team: { id: team.id, name: team.name },
      projectId: task.project_id,
    }),
  );
};

export const DeleteTask = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = TaskParamsSchema.parse(req.params);
  const { taskId } = parsedParams;

  const task = await requireTask(taskId, workspaceId);
  const rowsDeleted = await deleteTask(task.id);

  if (!rowsDeleted || rowsDeleted <= 0) {
    throw ApiError.internal('Something went wrong while deleting the task');
  }

  return res.status(200).json(new ApiResponse(200, 'Task deleted'));
};

export const GetTaskActivity = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 20;

  const { taskId } = GetTaskActivityParamsSchema.parse(req.params);
  const { cursorId, cursorTime } = GetTaskActivityQuerySchema.parse(req.query);

  const task = await requireTask(taskId, user.activeWorkspace);

  const taskActivities = await getTaskActivitiesByTaskId(
    task.id,
    LIMIT + 1,
    cursorId,
    cursorTime,
  );

  const hasMore = taskActivities.length > LIMIT;
  const pageActivities = hasMore
    ? taskActivities.slice(0, LIMIT)
    : taskActivities;
  const cursor = hasMore
    ? {
        id: pageActivities[pageActivities.length - 1].id,
        time: pageActivities[pageActivities.length - 1].created_at_cursor,
      }
    : null;

  const formatedActivities = pageActivities.map((a) => {
    if (a.activity_type === 'comment') {
      return {
        id: a.id,
        taskId: a.task_id,
        userId: a.user_id,
        username: a.username,
        content: a.content,
        activityType: a.activity_type,
        updatedAt: a.updated_at,
        createdAt: a.created_at,
      };
    } else {
      return {
        id: a.id,
        taskId: a.task_id,
        userId: a.user_id,
        username: a.username,
        activityType: a.activity_type,
        type: a.type,
        metadata: a.metadata,
        description: a.description,
        createdAt: a.created_at,
      };
    }
  });

  if (!taskActivities) {
    throw ApiError.notFound(
      'Something went wrong while getting task activities',
    );
  }

  res.status(200).json(
    new ApiResponse(200, 'Task activity', {
      activities: formatedActivities,
      hasMore,
      cursor,
    }),
  );
};

export const ConnectTaskToProject = async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId } = ConnectTaskToProjectParamsSchema.parse(req.params);
  const { projectId, milestoneId } = ConnectTaskToProjectBodySchema.parse(
    req.body,
  );

  const task = await requireTask(taskId, user.activeWorkspace);

  let project = null;
  let milestone = null;

  if (projectId !== null) {
    project = await getProjectByIdAndWorkspaceId(
      projectId,
      user.activeWorkspace,
    );

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (milestoneId) {
      milestone = await getProjectMilestonesWithIdAndProjectId(
        milestoneId,
        project.id,
      );

      if (!milestone) {
        throw ApiError.notFound('Project milestone not found');
      }
    }
  }

  const nextMilestoneId = projectId === null ? null : (milestoneId ?? null);
  const associationChanged =
    task.project_id !== projectId ||
    task.project_milestone_id !== nextMilestoneId;

  let activity: { type: TaskActivityType; description: string } | undefined;
  if (associationChanged) {
    let activityType: TaskActivityType;
    let description: string;

    if (!projectId) {
      activityType = 'task_removed_from_project';
      description = `${user.fullName} removed '${task.title}' from its project`;
    } else if (milestone) {
      activityType = 'task_connected_to_milestone';
      description = `${user.fullName} connected '${task.title}' to milestone '${milestone.name}' in '${project!.name}'`;
    } else {
      activityType = 'task_connected_to_project';
      description = `${user.fullName} connected '${task.title}' to project '${project!.name}'`;
    }

    activity = {
      type: activityType,
      description,
    };
  }

  const shouldNotifyProjectLead = Boolean(
    project &&
    task.project_id !== project.id &&
    project.lead_id &&
    project.lead_id !== user.id,
  );

  await connectTaskToProjectWorkflow({
    task,
    user,
    projectId,
    milestoneId: nextMilestoneId,
    activity,
    ...(shouldNotifyProjectLead && project?.lead_id
      ? {
          notification: {
            userId: project.lead_id,
            workspaceId: project.workspace_id,
            projectId: project.id,
            message: `${user.fullName} added task to '${project.name}'`,
          },
        }
      : {}),
  });

  // Send the real-time event only after the database transaction commits.
  if (shouldNotifyProjectLead && project?.lead_id) {
    notifyMemberInWorkspace(project.lead_id, project.workspace_id, {
      type: 'project:task_added',
      message: `${user.fullName} added '${task.title}' to '${project.name}'`,
      metaData: {
        actorId: user.id,
        projectId: project.id,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, 'Task project updated'));
};
