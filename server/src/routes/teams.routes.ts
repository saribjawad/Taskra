import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateTeam, GetWorkspaceTeams } from '../controllers/teams.controller';

const teamRouter = Router();
teamRouter.use(AuthMiddleware);

teamRouter
  .route('/')
  .post(asyncHandler(CreateTeam))
  .get(asyncHandler(GetWorkspaceTeams));

export default teamRouter;
