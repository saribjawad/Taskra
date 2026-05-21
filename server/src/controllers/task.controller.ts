import { Request, Response } from 'express';
import {
  CreateTaskSchema,
  TaskParamsSchema,
  UpdateTaskSchema,
} from '../schemas/task.schema';
import { findUserById } from '../services/user.service';
import { ApiError } from '../utils/ApiErrors';
import { createTask, findTaskById, updateTask } from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';

// ==================================================================================
// Task Controllers
// ==================================================================================

export const CreateTask = async (req: Request, res: Response) => {
  const parsedBody = CreateTaskSchema.parse(req.body);

  const { assignee, description, label, priority, status, title } = parsedBody;

  const assigneeUser = await findUserById(assignee);

  if (!assigneeUser) {
    throw ApiError.notFound('Invalid assignee');
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

  const count = await updateTask(taskId, parsedBody);

  if (!count || count <= 0) {
    throw ApiError.internal('Something went wrong while update the task');
  }

  res.status(200).json(new ApiResponse(200, 'Task updated'));
};
