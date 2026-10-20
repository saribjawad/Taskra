import { deleteFileFromS3, FILE_TYPE, uploadFileToS3 } from '../config/s3';
import { executeTranscation } from '../db/transaction';
import {
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '../models/task.model';
import { WorkspaceMember } from '../models/workspace.model';
import { createAttachment } from '../services/attachment.service';
import { deleteAttachmentById } from '../services/attachment.service';
import { createNotification } from '../services/notifications.service';
import { createTask } from '../services/task.service';
import { createTaskActivity } from '../services/taskActivity.service';
import { markTaskAsComplete, updateTask } from '../services/task.service';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { Task } from '../models/task.model';
import { TaskActivityType } from '../models/taskActivity.model';
import { ApiError } from '../utils/ApiErrors';
import { Attachment, AttachmentsMimeTypes } from '../models/attachments.model';
import { User } from '../models/user.model';

interface CreateTaskWorkflowInput {
  user: {
    id: string;
    fullName: string;
    email: string;
    activeWorkspace: string;
  };
  assigneeMember: WorkspaceMember | undefined;
  reporterMember: WorkspaceMember | undefined;
  payload: {
    title: string;
    description: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    label: TaskLabelType;
    activeWorkspace: string;
    userId: string;
    startDate: Date | undefined;
    dueDate: Date | undefined;
    assignee: string | null;
    reporter: string | null;
  };
  files: any[];
}

export const createTaskWorkflow = async (data: CreateTaskWorkflowInput) => {
  const { payload, user, assigneeMember, reporterMember, files } = data;

  // Array of uploaded attachment, so we can delete from S3 bucket if the transcation fails
  const uploadedAttachments: Array<string> = [];

  try {
    const results = await executeTranscation(async (txClient) => {
      // Create task
      const task = await createTask(
        {
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          label: payload.label,
          workspaceId: payload.activeWorkspace,
          userId: payload.userId,
          startDate: payload.startDate,
          dueDate: payload.dueDate,
          assignee: payload.assignee,
          reporter: payload.reporter,
        },
        txClient,
      );

      // Create task activity
      const activity = await createTaskActivity(
        {
          taskId: task.id,
          userId: user.id,
          type: 'task_created',
          description: `${user.fullName} created the task.`,
        },
        txClient,
      );

      // Create notification if the assignee !== current user

      let assigneeNotification;
      if (assigneeMember && assigneeMember.user_id !== user.id) {
        assigneeNotification = await createNotification(
          {
            userId: assigneeMember.user_id,
            workspaceId: task.workspace_id,
            type: 'task:assigned',
            message: 'A task has been assigned to you',
            metaData: {
              actorId: user.id,
              taskId: task.id,
            },
          },
          txClient,
        );
      }

      // Create notification if the reporter !== current user

      let reporterNotification;
      if (
        reporterMember &&
        reporterMember.user_id !== user.id &&
        reporterMember.user_id !== assigneeMember?.user_id
      ) {
        reporterNotification = await createNotification(
          {
            userId: reporterMember.user_id,
            workspaceId: task.workspace_id,
            type: 'task:reporter_assigned',
            message: 'You were assigned as the reporter of a task',
            metaData: {
              actorId: user.id,
              taskId: task.id,
            },
          },
          txClient,
        );
      }
      // Upload new attachments files to s3 bucket and save in DB

      const result = await Promise.allSettled(
        files.map(async (f) => {
          const storageId = `attachment/${f.originalname}-${uuidv4()}`;

          // Upload the file to s3
          await uploadFileToS3(f.mimetype as FILE_TYPE, storageId, f.buffer);

          uploadedAttachments.push(storageId);

          // Save the attachment in DB
          await createAttachment(
            {
              taskId: task.id,
              name: f.originalname,
              size: f.size,
              mimeType: f.mimetype,
              storageId,
            },
            txClient,
          );
        }),
      );

      for (const r of result) {
        if (r.status === 'rejected') {
          throw r.reason;
        }
      }

      return { task, activity, assigneeNotification, reporterNotification };
    });

    return results;
  } catch (e) {
    logger.info('Task creation failed: removing uploaded attachments from s3');
    // Remove the attachment uploaded to s3
    for (const key of uploadedAttachments) {
      try {
        await deleteFileFromS3(key);
      } catch (cleanupError) {
        logger.error(
          `Failed to clean up task attachment '${key}' from S3`,
          cleanupError,
        );
      }
    }

    throw e;
  }
};

interface UpdateTaskWorkflowInput {
  user: {
    id: string;
    fullName: string;
  };
  task: Task;
  payload: Parameters<typeof updateTask>[1];
  assigneeUser?: User;
  reporterUser?: User;
  files: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }>;
  removedAttachments: Attachment[];
}

export const updateTaskWorkflow = async (data: UpdateTaskWorkflowInput) => {
  const {
    task,
    user,
    payload,
    assigneeUser,
    reporterUser,
    files,
    removedAttachments,
  } = data;
  const uploadedAttachments: string[] = [];
  const attachmentKeysToDelete = removedAttachments.map(
    (attachment) => attachment.storage_id,
  );
  const activityMap: Record<string, TaskActivityType> = {
    title: 'title_changed',
    status: 'status_changed',
    priority: 'priority_changed',
    assignee: 'assignee_changed',
    reporter: 'reporter_changed',
  };

  try {
    // Upload first so a storage failure cannot leave the database partially updated.
    for (const file of files) {
      const storageId = `attachment/${file.originalname}-${uuidv4()}`;
      const upload = await uploadFileToS3(
        file.mimetype as FILE_TYPE,
        storageId,
        file.buffer,
      );

      if (!upload) {
        throw new Error(`Failed to upload attachment '${file.originalname}'`);
      }

      uploadedAttachments.push(storageId);
    }

    const result = await executeTranscation(async (txClient) => {
      const updatedRows = Object.keys(payload).length
        ? await updateTask(task.id, payload, txClient)
        : 0;

      for (const [field, type] of Object.entries(activityMap)) {
        const nextValue = payload[field as keyof typeof payload];
        if (
          nextValue === undefined ||
          nextValue === task[field as keyof Task]
        ) {
          continue;
        }

        let description = `${user.fullName} changed ${field} to '${nextValue ?? 'none'}'`;

        if (field === 'assignee' && nextValue !== null) {
          description = `${user.fullName} changed the assignee to ${assigneeUser?.full_name}`;
        }
        if (field === 'reporter' && nextValue !== null) {
          description = `${user.fullName} changed the reporter to ${reporterUser?.full_name}`;
        }

        await createTaskActivity(
          {
            taskId: task.id,
            userId: user.id,
            type,
            description,
            metadata: {
              field,
              from: String(task[field as keyof Task] ?? ''),
              to: String(nextValue ?? ''),
            },
          },
          txClient,
        );
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await createAttachment(
          {
            taskId: task.id,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype as AttachmentsMimeTypes,
            storageId: uploadedAttachments[i],
          },
          txClient,
        );

        await createTaskActivity(
          {
            taskId: task.id,
            userId: user.id,
            type: 'attachment_added',
            description: `${user.fullName} attached an attachment '${file.originalname}'`,
          },
          txClient,
        );
      }

      // Notify the assignee if the actor himself is not the assignee
      if (assigneeUser && assigneeUser.id !== user.id) {
        await createNotification(
          {
            userId: assigneeUser.id,
            workspaceId: task.workspace_id,
            type: 'task:assigned',
            message: 'A task has been assigned to you',
            metaData: {
              actorId: user.id,
              taskId: task.id,
            },
          },
          txClient,
        );
      }

      // Notify the reporter if the actor himself is not the reporter
      if (
        reporterUser &&
        reporterUser.id !== user.id &&
        reporterUser.id !== assigneeUser?.id
      ) {
        await createNotification(
          {
            userId: reporterUser.id,
            workspaceId: task.workspace_id,
            type: 'task:reporter_assigned',
            message: 'You were assigned as the reporter of a task',
            metaData: {
              actorId: user.id,
              taskId: task.id,
            },
          },
          txClient,
        );
      }

      // Remove the attachments from DB removed by user
      for (const attachment of removedAttachments) {
        await deleteAttachmentById(attachment.id, txClient);
      }

      return updatedRows;
    });

    // The database commit succeeded, so removed files can now be deleted from S3.
    for (const key of attachmentKeysToDelete) {
      try {
        await deleteFileFromS3(key);
      } catch (error) {
        logger.error(
          `Failed to delete removed task attachment '${key}' from S3`,
          error,
        );
      }
    }

    return result;
  } catch (error) {
    // Database rollback cannot undo S3 uploads, so remove any files uploaded above.
    for (const key of uploadedAttachments) {
      try {
        await deleteFileFromS3(key);
      } catch (cleanupError) {
        logger.error(
          `Failed to clean up task attachment '${key}' from S3`,
          cleanupError,
        );
      }
    }

    throw error;
  }
};

export const markTaskAsCompletedWorkflow = async (data: {
  task: Task;
  user: { id: string; fullName: string };
  completedDate: Date;
}) => {
  const { task, user, completedDate } = data;
  const recipients = new Set([task.assignee, task.reporter]);

  return executeTranscation(async (txClient) => {
    await markTaskAsComplete(task.id, completedDate, txClient);

    await createTaskActivity(
      {
        taskId: task.id,
        userId: user.id,
        type: 'task_completed',
        description: `${user.fullName} marked the task as completed`,
      },
      txClient,
    );

    for (const recipient of recipients) {
      if (!recipient || recipient === user.id) continue;
      await createNotification(
        {
          userId: recipient,
          workspaceId: task.workspace_id,
          type: 'task:completed',
          message: 'Task has been marked as completed',
          metaData: {
            actorId: user.id,
            taskId: task.id,
          },
        },
        txClient,
      );
    }

    return [...recipients].filter(
      (recipient) => recipient && recipient !== user.id,
    );
  });
};

export const connectTaskToProjectWorkflow = async (data: {
  task: Task;
  user: { id: string };
  projectId: string | null;
  milestoneId: string | null;
  activity?: { type: TaskActivityType; description: string };
  notification?: {
    userId: string;
    workspaceId: string;
    projectId: string;
    message: string;
  };
}) => {
  const { task, user, projectId, milestoneId, activity, notification } = data;

  return executeTranscation(async (txClient) => {
    await updateTask(
      task.id,
      {
        project_id: projectId,
        project_milestone_id: milestoneId,
      },
      txClient,
    );

    if (activity) {
      await createTaskActivity(
        {
          taskId: task.id,
          userId: user.id,
          type: activity.type,
          description: activity.description,
        },
        txClient,
      );
    }

    if (notification) {
      await createNotification(
        {
          userId: notification.userId,
          workspaceId: notification.workspaceId,
          type: 'project:task_added',
          message: notification.message,
          metaData: { actorId: user.id, projectId: notification.projectId },
        },
        txClient,
      );
    }
  });
};
