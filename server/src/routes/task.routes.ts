import { Router } from 'express';
import {
  CreateTask,
  GetTasks,
  UpdateTask,
} from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const taskRouter = Router();

taskRouter.route('/tasks').post(asyncHandler(CreateTask));

taskRouter.get('/tasks', asyncHandler(GetTasks));

taskRouter.route('/task/:taskId').patch(asyncHandler(UpdateTask));

export default taskRouter;
