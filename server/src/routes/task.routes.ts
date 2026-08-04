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
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';
import { upload } from '../middlewares/multer.middleware';

const taskRouter = Router();
taskRouter.use(AuthMiddleware);
taskRouter.use(RequrieActiveWorkspace);

taskRouter
  .route('/')
  .post(
    upload.fields([
      {
        name: 'images',
        maxCount: 3,
      },
      {
        name: 'pdf',
        maxCount: 1,
      },
      {
        name: 'document',
        maxCount: 1,
      },
    ]),
    asyncHandler(CreateTask),
  )
  .get(asyncHandler(GetTasks));

taskRouter
  .route('/:taskId')
  .get(asyncHandler(GetTask))
  .patch(asyncHandler(UpdateTask))
  .delete(asyncHandler(DeleteTask));

export default taskRouter;
