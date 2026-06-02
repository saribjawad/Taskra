import { Router } from 'express';
import {
  CreateTask,
  GetTasks,
  UpdateTask,
} from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const taskRouter = Router();

taskRouter
  .route('/tasks')
  .post(AuthMiddleware, asyncHandler(CreateTask))
  .get(AuthMiddleware, asyncHandler(GetTasks));

taskRouter
  .route('/task/:taskId')
  .patch(AuthMiddleware, asyncHandler(UpdateTask));

export default taskRouter;
