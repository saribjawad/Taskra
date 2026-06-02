import { Router } from 'express';
import {
  CreateTask,
  GetTasks,
  UpdateTask,
} from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const taskRouter = Router();
taskRouter.use(AuthMiddleware);

taskRouter
  .route('/tasks')
  .post(asyncHandler(CreateTask))
  .get(asyncHandler(GetTasks));

taskRouter.route('/tasks/:taskId').patch(asyncHandler(UpdateTask));

export default taskRouter;
