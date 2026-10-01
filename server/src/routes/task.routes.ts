import { Router } from 'express';
import {
  ConnectTaskToProject,
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
import {
  CreateComment,
  DeleteComment,
  UpdateComment,
} from '../controllers/taskComments.controller';

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

taskRouter
  .route('/:taskId/project')
  .post(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(ConnectTaskToProject),
  );

taskRouter
  .route('/:taskId/comments')
  .post(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateComment),
  );

taskRouter
  .route('/:taskId/comments/:commentId')
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateComment),
  )
  .delete(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(DeleteComment),
  );

export default taskRouter;
