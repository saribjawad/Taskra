import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  AddProjectMembers,
  CreateProject,
  GetProjects,
} from '../controllers/projects.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);

projectsRouter.route('/').post(asyncHandler(CreateProject));

projectsRouter.route('/:workspaceId').get(asyncHandler(GetProjects));

projectsRouter
  .route('/:projectId/members')
  .post(asyncHandler(AddProjectMembers));

export default projectsRouter;
