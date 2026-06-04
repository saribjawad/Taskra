import { Router } from 'express';
import {
  CreateTask,
  DeleteTask,
  GetTask,
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

taskRouter
  .route('/tasks/:taskId')
  .get(asyncHandler(GetTask))
  .patch(asyncHandler(UpdateTask))
  .delete(asyncHandler(DeleteTask));

export default taskRouter;
