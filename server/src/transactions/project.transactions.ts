import { executeTranscation } from '../db/transaction';
import { NotificationType } from '../models/notifications.model';
import { ProjectActivityType } from '../models/projectActivity.model';
import {
  Project,
  ProjectPriorityType,
  ProjectStatusType,
} from '../models/projects.model';
import { ProjectMemberWithUserId } from '../models/projectMembers.model';
import { User } from '../models/user.model';
import { WorkspaceMemberWithUserDetails } from '../models/workspace.model';
import {
  createNotification,
  createNotificationNew,
} from '../services/notifications.service';
import { createProjectActivity } from '../services/projectActivity.service';
import {
  createProjectMember,
  deleteProjectMember,
  getProjectMembersByProjectId,
} from '../services/projectMembers';
import { createProject, updateProject } from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';

interface CreateProjectWorkflowInput {
  user: {
    id: string;
    email: string;
    fullName: string;
    activeWorkspace: string;
  };
  projectPayload: {
    name: string;
    priority: ProjectPriorityType;
    status: ProjectStatusType;
    workspace_id: string;
    description?: string;
    lead_id?: string;
    short_summary?: string;
    start_date?: Date;
    target_date?: Date;
  };
  leadUser?: {
    id?: string;
  };
}

export const createProjectWorkflow = async (
  data: CreateProjectWorkflowInput,
) => {
  const { projectPayload, user, leadUser } = data;

  // Execute the transcations function, and pass the callback
  const result = await executeTranscation(async (txClient) => {
    // Create project
    const project = await createProject(projectPayload, txClient);

    // Create project activity
    const activity = await createProjectActivity(
      {
        userId: user.id,
        projectId: project.id,
        description: `${user.fullName} created the project.`,
        type: 'project_created',
      },
      txClient,
    );

    let notification;

    if (leadUser && leadUser.id && leadUser.id !== user.id) {
      // Create a notification if leadUser is not the same as logged in user
      notification = await createNotificationNew(
        {
          userId: leadUser.id,
          workspaceId: project.workspace_id,
          type: 'project:lead_assigned',
          message: `You have been assigne as a lead to "${project.name}" project`,
          metaData: { actorId: user.id, projectId: project.id },
        },
        txClient,
      );

      if (!notification) {
        throw ApiError.internal(
          'Something went wrong while creating the notification',
        );
      }
    }

    return { project, activity, notification };
  });

  return result;
};

interface UpdateProjectWorkflowInput {
  user: {
    id: string;
    email: string;
    fullName: string;
    activeWorkspace: string;
  };
  leadUser?: User;
  project: Project;
  payload: {
    name?: string;
    short_summary?: string;
    description?: string;
    priority?: ProjectPriorityType;
    status?: ProjectStatusType;
    lead_id?: string;
    start_date?: Date;
    target_date?: Date;
  };
}

export const updateProjectWorkflow = async (
  data: UpdateProjectWorkflowInput,
) => {
  const { user, leadUser, project, payload } = data;

  const pendingSocketEvents: Array<{
    userId: string;
    workspaceId: string;
    event: {
      type: NotificationType;
      message: string;
      metaData: Record<string, any>;
    };
  }> = [];

  await executeTranscation(async (txClient) => {
    // Update the project
    await updateProject({ id: project.id, ...payload }, txClient);

    // Create project activities
    const activityMap: Record<keyof typeof payload, ProjectActivityType> = {
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
      const key = field as keyof typeof payload;
      if (
        payload[key] !== undefined &&
        payload[key] !== project[field as keyof Project]
      ) {
        let description = `${user.fullName} changed ${field} to ${payload[field as keyof typeof payload]}`;

        // Manually add lead email
        if (field === 'lead_id') {
          description = `${user.fullName} changed lead to ${leadUser?.full_name}`;
        }

        if (field === 'description') {
          description = `${user.fullName} updated the description`;
        }

        await createProjectActivity(
          {
            projectId: project.id,
            userId: user.id,
            description,
            type: activityType as ProjectActivityType,

            metadata: {
              field,
              from: String(project[field as keyof Project] ?? ''),
              to: String(payload[field as keyof typeof payload] ?? ''),
            },
          },
          txClient,
        );
      }
    }

    // Create notification for lead user
    if (
      leadUser &&
      leadUser.id !== user.id &&
      leadUser.id !== project.lead_id
    ) {
      await createNotification(
        {
          userId: leadUser.id,
          workspaceId: project.workspace_id,
          type: 'project:lead_assigned',
          message: `You have been assigne as a lead to '${payload.name ?? project.name}' project`,
          metaData: { actorId: user.id, projectId: project.id },
        },
        txClient,
      );
    }

    // Notify lead user and the members if completed
    if (
      payload.status &&
      payload.status === 'completed' &&
      project.status !== payload.status
    ) {
      const members = (
        await getProjectMembersByProjectId({ projectId: project.id }, txClient)
      ).map((m) => m.user_id);

      const currentLeadId =
        (payload.lead_id as string | undefined) ?? project.lead_id;
      const notificationRecipients = new Set([currentLeadId, ...members]);

      for (const r of notificationRecipients) {
        if (!r || r === user.id) return;

        const message = `${user.fullName} marked the '${payload.name ?? project.name}' project as done.`;

        await createNotification(
          {
            userId: r,
            workspaceId: project.workspace_id,
            type: 'task:completed',
            message,
            metaData: { actorId: user.id, projectId: project.id },
          },
          txClient,
        );

        pendingSocketEvents.push({
          userId: r,
          workspaceId: project.workspace_id,
          event: {
            type: 'task:completed' as NotificationType,
            message,
            metaData: {
              actorId: user.id,
              projectId: project.id,
            },
          },
        });
      }
    }
  });

  return pendingSocketEvents;
};

interface AddProjectMemberWorkflowInput {
  user: {
    id: string;
    fullName: string;
    email: string;
    activeWorkspace: string;
  };
  members: WorkspaceMemberWithUserDetails[];
  project: Project;
  result: {
    added: string[];
    failed: string[];
  };
}

export const addProjectMemberWorkflow = async (
  data: AddProjectMemberWorkflowInput,
) => {
  const { members, project, user, result } = data;

  const pendingWebsocketEvents: Array<{
    userId: string;
    workspaceId: string;
    event: {
      type: NotificationType;
      message: string;
      metaData: Record<string, any>;
    };
  }> = [];

  await executeTranscation(async (txClient) => {
    for (const member of members) {
      // Create project member
      const projectMember = await createProjectMember(
        {
          userId: member.user.id,
          projectId: project.id,
        },
        txClient,
      );

      // Create project activity
      await createProjectActivity({
        projectId: project.id,
        userId: user.id,
        description: `${user.fullName} added ${member.user.full_name} as member`,
        type: 'member_added',
      });

      // Create notification
      await createNotification({
        userId: projectMember.user_id,
        workspaceId: project.workspace_id,
        type: 'project:member_assigned',
        message: `You have been added as a member to '${project.name}' project`,
        metaData: { actorId: user.id, projectId: project.id },
      });

      pendingWebsocketEvents.push({
        userId: projectMember.user_id,
        workspaceId: project.workspace_id,
        event: {
          type: 'project:member_assigned',
          message: `You have been added as a member to '${project.name}' project`,
          metaData: { actorId: user.id, projectId: project.id },
        },
      });

      result.added.push(member.user.id);
    }
  });

  return pendingWebsocketEvents;
};

interface RemoveProjectMemberWorkflowInput {
  user: {
    id: string;
    fullName: string;
    email: string;
    activeWorkspace: string;
  };
  members: ProjectMemberWithUserId[];
  project: Project;
  result: {
    removed: string[];
    failed: string[];
  };
}

export const removeProjectMemberWorkflow = async (
  data: RemoveProjectMemberWorkflowInput,
) => {
  const { members, project, user, result } = data;

  await executeTranscation(async (txClient) => {
    for (const member of members) {
      // Delete project member
      await deleteProjectMember(
        { id: member.id, projectId: project.id },
        txClient,
      );

      // Create project activity
      await createProjectActivity(
        {
          projectId: project.id,
          userId: user.id,
          description: `${user.fullName} removed ${member.user.full_name} from member`,
          type: 'member_removed',
        },
        txClient,
      );

      result.removed.push(member.user_id);
    }
  });
};
