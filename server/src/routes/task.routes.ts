import { Router } from 'express';
import { CreateTask, UpdateTask } from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const taskRouter = Router();

taskRouter
  .post('/tasks', asyncHandler(CreateTask))
  .patch('/tasks/:taskId', asyncHandler(UpdateTask));

export default taskRouter;
