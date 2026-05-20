import { Request, Response } from 'express';
import { CreateTaskSchema } from '../schemas/task.schema';
import { findUserById } from '../services/user.service';
import { ApiError } from '../utils/ApiErrors';
import { createTask } from '../services/task.service';

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

  res.send(createdTask);
};
