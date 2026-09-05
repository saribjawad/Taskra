import { Request, Response } from 'express';
import {
  CreateTaskSchema,
  GetTaskQuerySchema,
  MarkTaskAsCompletedParamsSchema,
  TaskParamsSchema,
  UpdateTaskSchema,
} from '../schemas/task.schema';
import { findUserById } from '../services/user.service';
import { ApiError } from '../utils/ApiErrors';
import {
  createTask,
  deleteTask,
  findTaskById,
  getTasks,
  markTaskAsComplete,
  updateTask,
} from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import { findCommentsByTaskId } from '../services/comment.service';
import { deleteFileFromS3, FILE_TYPE, uploadFileToS3 } from '../config/s3';
import {
  createAttachment,
  deleteAttachmentById,
  getAttachmentByIdAndTaskId,
  getAttachmentsByTaskId,
} from '../services/attachment.service';
import { v4 as uuidv4 } from 'uuid';
import { createTaskActivity } from '../services/taskActivity.service';
import { TaskActivityType } from '../models/taskActivity.model';
import { Task } from '../models/task.model';

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
    label,
    priority,
    status,
    title,
    dueDate,
    startDate,
    assignee: assigneeId,
    reporter: reporterId,
  } = body;

  let assigneeUser;
  let reporterUser;

  // If the assigne exists query the user

  if (assigneeId) {
    assigneeUser = await findUserById(assigneeId);
    if (!assigneeUser) {
      throw ApiError.notFound('Assignee not found');
    }
  }

  if (reporterId) {
    reporterUser = await findUserById(reporterId);
    if (!reporterUser) {
      throw ApiError.notFound('Reporter not found');
    }
  }

  const task = await createTask(
    title,
    description,
    status,
    priority,
    label,
    activeWorkspace,
    user.id,
    startDate,
    dueDate,
    assigneeUser ? assigneeUser.id : null,
    reporterUser ? reporterUser.id : null,
  );

  if (!task) {
    throw ApiError.internal('Something went wrong while creating the task');
  }

  // Upload new attachments files to s3 bucket and save in DB
  const files = Object.values(req.files ?? {}).flat();

  await Promise.all(
    files.map(async (f) => {
      const storageId = `attachment/${f.originalname}-${uuidv4()}`;

      // Upload the file to s3
      await uploadFileToS3(f.mimetype as FILE_TYPE, storageId, f.buffer);

      // Save the attachment in DB
      await createAttachment(
        task.id,
        f.originalname,
        f.size,
        f.mimetype,
        storageId,
      );
    }),
  );

  // Create task activity
  const taskActivity = await createTaskActivity(
    task.id,
    user.id,
    'task_created',
    `${user.email} created the task.`,
  );

  if (!taskActivity) {
    throw ApiError.internal(
      'Something went wrong while creating task activity',
    );
  }

  res.status(201).json(new ApiResponse(201, 'Task created'));
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

  const task = await findTaskById(taskId, user.activeWorkspace);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

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
    assigneeUser = await findUserById(assigneeId);
    if (!assigneeUser) {
      throw ApiError.notFound('Assignee not found');
    }
  }
  if (reporterId) {
    reporterUser = await findUserById(reporterId);
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

  const count = await updateTask(taskId, payload);

  if (!count || count <= 0) {
    throw ApiError.internal('Something went wrong while update the task');
  }

  const activityMap = {
    title: 'title_changed',
    status: 'status_changed',
    priority: 'priority_changed',
    assignee: 'assignee_changed',
    reporter: 'reporter_changed',
  };

  //  Create task activity
  for (const [field, activityValue] of Object.entries(activityMap)) {
    if (
      payload[field] !== undefined &&
      payload[field] !== task[field as keyof Task]
    ) {
      const nextValue = payload[field];

      let description = `${user.email} changed ${field} to ${nextValue ?? 'none'}`;

      // Manually add assignee/reporter email
      if (field === 'assignee' && payload['assignee'] !== null) {
        description = `${user.email} changed the assignee to ${assigneeUser?.email}`;
      }
      if (field === 'reporter' && payload['reporter'] !== null) {
        description = `${user.email} changed the reporter to ${reporterUser?.email}`;
      }

      await createTaskActivity(
        task.id,
        user.id,
        activityValue as TaskActivityType,
        description,
        {
          field: field,
          from: String(task[field as keyof Task] ?? ''),
          to: String(nextValue ?? ''),
        },
      );
    }
  }

  // Remove attachments which user have removed
  await Promise.all(
    removedAttachmentIds.map(async (a, i) => {
      const attachment = await getAttachmentByIdAndTaskId(a, task.id);

      await deleteFileFromS3(attachment.storage_id);

      await deleteAttachmentById(attachment.id);
    }),
  );

  // Upload new attachments files to s3 bucket and save in DB
  const files = Object.values(req.files ?? {}).flat();

  await Promise.all(
    files.map(async (f) => {
      const storageId = `attachment/${f.originalname}-${uuidv4()}`;

      // Upload the file to s3
      await uploadFileToS3(f.mimetype as FILE_TYPE, storageId, f.buffer);

      // Save the attachment in DB
      await createAttachment(
        task.id,
        f.originalname,
        f.size,
        f.mimetype,
        storageId,
      );

      // Create task activity
      await createTaskActivity(
        task.id,
        user.id,
        'attachment_added',
        `${user.email} attached an attachment '${f.originalname}'`,
      );
    }),
  );

  res.status(200).json(new ApiResponse(200, 'Task updated'));
};

export const MarkTaskAsCompleted = async (req: Request, res: Response) => {
  const user = req.user;
  const { taskId } = MarkTaskAsCompletedParamsSchema.parse(req.params);

  const task = await findTaskById(taskId, user.activeWorkspace);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  const currentDate = new Date();

  const count = await markTaskAsComplete(taskId, currentDate);

  if (!count || count <= 0) {
    throw ApiError.internal(
      'Something went wrong while marking the task as complete',
    );
  }

  const taskActivity = await createTaskActivity(
    taskId,
    user.id,
    'task_completed',
    `${user.email} marked the task as completed`,
  );

  if (!taskActivity) {
    throw ApiError.internal(
      'Something went wrong while creating the task activity',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Task marked as completed'));
};

export const GetTasks = async (req: Request, res: Response) => {
  /*
  TODO: Update into accordingly
   cursor pagination
   caching counts
  */

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

  const task = await findTaskById(taskId, workspaceId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Get assignee & reporter details
  const assignee = await findUserById(task.assignee);
  const reporter = await findUserById(task.reporter);

  // Get task comments
  const comments = await findCommentsByTaskId(taskId);

  // Get task attachments
  let attachments = await getAttachmentsByTaskId(taskId);

  return res.status(200).json(
    new ApiResponse(200, 'success', {
      ...task,
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        user: {
          id: c.user_id,
          username: c.username,
        },
        updated_at: c.updated_at,
        created_at: c.created_at,
      })),
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

export const DeleteTask = async (req: Request, res: Response) => {
  const workspaceId = req.user.activeWorkspace;

  const parsedParams = TaskParamsSchema.parse(req.params);
  const { taskId } = parsedParams;

  // Check if taskId is valid
  const task = await findTaskById(taskId, workspaceId);

  // Throw error 404 if not found
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const rowsDeleted = await deleteTask(taskId);

  if (!rowsDeleted || rowsDeleted <= 0) {
    throw ApiError.internal('Something went wrong while deleting the task');
  }

  return res.status(200).json(new ApiResponse(200, 'Task deleted'));
};
