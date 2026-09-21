import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateProject } from '../controllers/projects.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const projectsRouter = Router();
projectsRouter.use(AuthMiddleware);

projectsRouter.route('/').post(asyncHandler(CreateProject));

export default projectsRouter;
