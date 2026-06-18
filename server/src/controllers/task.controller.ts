import { Request, Response } from 'express';
import {
  CreateTaskSchema,
  GetTaskQuerySchema,
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
  updateTask,
} from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import { findCommentsByTaskId } from '../services/comment.service';

// ==================================================================================
// Task Controllers
// ==================================================================================

export const CreateTask = async (req: Request, res: Response) => {
  const activeWorkspace = req.user.activeWorkspace;
  const parsedBody = CreateTaskSchema.parse(req.body);

  const { assignee, description, label, priority, status, title } = parsedBody;

  const assigneeUser = await findUserById(assignee);

  if (!assigneeUser) {
    throw ApiError.notFound('Invalid assignee');
  }

  if (!activeWorkspace) {
    throw ApiError.badRequest('No active workspace');
  }

  const createdTask = await createTask(
    title,
    description,
    status,
    priority,
    label,
    assignee,
  );

  if (!createdTask) {
    throw ApiError.internal('Something went wrong while creating the task');
  }

  res.status(201).json(new ApiResponse(201, 'Task created'));
};

export const UpdateTask = async (req: Request, res: Response) => {
  const parsedParams = TaskParamsSchema.parse(req.params);

  const { taskId } = parsedParams;
  const parsedBody = UpdateTaskSchema.parse(req.body);
  const task = await findTaskById(taskId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const { assignee } = parsedBody;

  let assigneeUser;
  if (assignee) {
    assigneeUser = await findUserById(assignee);
  }

  if (assignee && !assigneeUser) {
    throw ApiError.notFound('Invalid assignee');
  }

  const count = await updateTask(taskId, parsedBody);

  if (!count || count <= 0) {
    throw ApiError.internal('Something went wrong while update the task');
  }

  res.status(200).json(new ApiResponse(200, 'Task updated'));
};

export const GetTasks = async (req: Request, res: Response) => {
  /*
  TODO: Update into accordingly
   cursor pagination
   caching counts
  */
  const parsedQueries = GetTaskQuerySchema.parse(req.query);

  const { page, limit, label, priority, status, search } = parsedQueries;
  const offset = (page - 1) * limit;

  // Adding one to check will there be a next page
  const tasks = await getTasks(
    limit + 1,
    offset,
    status,
    label,
    priority,
    search,
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
      tasks,
    }),
  );
};

export const GetTask = async (req: Request, res: Response) => {
  const parsedParam = TaskParamsSchema.parse(req.params);
  const { taskId } = parsedParam;

  const task = await findTaskById(taskId);
  const { email, username, id } = await findUserById(task.assignee);
  const comments = await findCommentsByTaskId(taskId);

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
      assignee: {
        id,
        username,
        email,
      },
    }),
  );
};

export const DeleteTask = async (req: Request, res: Response) => {
  const parsedParams = TaskParamsSchema.parse(req.params);
  const { taskId } = parsedParams;

  // Check if taskId is valid
  const task = await findTaskById(taskId);

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
