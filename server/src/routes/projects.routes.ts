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

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);

projectsRouter.route('/').post(asyncHandler(CreateProject));

projectsRouter
  .route('/:projectId')
  .get(asyncHandler(GetProject))
  .patch(asyncHandler(UpdateProject))
  .delete(asyncHandler(DeleteProject));

projectsRouter
  .route('/:projectId/activity')
  .get(asyncHandler(GetProjectActivity));

projectsRouter
  .route('/:projectId/progress')
  .get(asyncHandler(GetProjectProgress));

projectsRouter
  .route('/:projectId/members')
  .post(asyncHandler(AddProjectMembers))
  .delete(asyncHandler(RemoveProjectMembers));

projectsRouter.route('/:projectId/tasks').get(asyncHandler(GetProjectTasks));

projectsRouter
  .route('/:projectId/comments')
  .post(RequrieActiveWorkspace, asyncHandler(CreateProjectComment));

projectsRouter
  .route('/:projectId/comments/:commentId')
  .patch(RequrieActiveWorkspace, asyncHandler(UpdateProjectComment))
  .delete(RequrieActiveWorkspace, asyncHandler(DeleteProjectComment));

export default projectsRouter;
