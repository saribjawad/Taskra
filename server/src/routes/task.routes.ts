import { Router } from 'express';
import {
  CreateTask,
  DeleteTask,
  GetTask,
  GetTaskActivity,
  GetTasks,
  MarkTaskAsCompleted,
  UpdateTask,
} from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';
import { upload } from '../middlewares/multer.middleware';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

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
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateTask),
  )
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTasks),
  );

taskRouter
  .route('/:taskId')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTask),
  )
  .patch(
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
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateTask),
  )

  .delete(RequiredRoles(['owner', 'admin']), asyncHandler(DeleteTask));

taskRouter
  .route('/:taskId/activity')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTaskActivity),
  );
taskRouter
  .route('/:taskId/completed')
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(MarkTaskAsCompleted),
  );

export default taskRouter;
