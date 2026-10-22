import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  AddProjectMembers,
  CreateProject,
  DeleteProject,
  GetProject,
  GetProjectActivity,
  GetProjectProgress,
  GetProjectTasks,
  RemoveProjectMembers,
  UpdateProject,
} from '../controllers/projects.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';
import {
  CreateProjectComment,
  DeleteProjectComment,
  UpdateProjectComment,
} from '../controllers/projectComments.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);
projectsRouter.use(RequrieActiveWorkspace);

projectsRouter
  .route('/')
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(CreateProject));

projectsRouter
  .route('/:projectId')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetProject),
  )
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateProject),
  )
  .delete(RequiredRoles(['owner', 'admin']), asyncHandler(DeleteProject));

projectsRouter
  .route('/:projectId/activity')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetProjectActivity),
  );

projectsRouter
  .route('/:projectId/progress')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetProjectProgress),
  );

projectsRouter
  .route('/:projectId/members')
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(AddProjectMembers))
  .delete(
    RequiredRoles(['owner', 'admin']),
    asyncHandler(RemoveProjectMembers),
  );

projectsRouter
  .route('/:projectId/tasks')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetProjectTasks),
  );

projectsRouter
  .route('/:projectId/comments')
  .post(
    RequrieActiveWorkspace,
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateProjectComment),
  );

projectsRouter
  .route('/:projectId/comments/:commentId')
  .patch(
    RequrieActiveWorkspace,
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateProjectComment),
  )
  .delete(
    RequrieActiveWorkspace,
    RequiredRoles(['owner', 'admin']),
    asyncHandler(DeleteProjectComment),
  );

export default projectsRouter;
