import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  AddProjectMembers,
  CreateProject,
  DeleteProject,
  GetProject,
  GetProjectTasks,
  RemoveProjectMembers,
  UpdateProject,
} from '../controllers/projects.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);

projectsRouter.route('/').post(asyncHandler(CreateProject));

projectsRouter
  .route('/:projectId')
  .get(asyncHandler(GetProject))
  .patch(asyncHandler(UpdateProject))
  .delete(asyncHandler(DeleteProject));

projectsRouter
  .route('/:projectId/members')
  .post(asyncHandler(AddProjectMembers))
  .delete(asyncHandler(RemoveProjectMembers));

projectsRouter.route('/:projectId/tasks').get(asyncHandler(GetProjectTasks));

export default projectsRouter;
