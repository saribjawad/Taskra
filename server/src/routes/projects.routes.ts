import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  AddProjectMembers,
  CreateProject,
  GetProject,
  RemoveProjectMembers,
} from '../controllers/projects.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);

projectsRouter.route('/').post(asyncHandler(CreateProject));

projectsRouter.route('/:projectId').get(asyncHandler(GetProject));

projectsRouter
  .route('/:projectId/members')
  .post(asyncHandler(AddProjectMembers))
  .delete(asyncHandler(RemoveProjectMembers));

export default projectsRouter;
