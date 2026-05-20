import { Router } from 'express';
import { CreateTask } from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const taskRouter = Router();

taskRouter.post('/tasks', asyncHandler(CreateTask));

export default taskRouter;
