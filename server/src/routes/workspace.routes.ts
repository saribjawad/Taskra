import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import {
  CreateWorkspace,
  DeleteWorkspace,
  GetUserWorkspaces,
  SwitchWorkspace,
} from '../controllers/workspace.controller';

const workspaceRouter = Router();

workspaceRouter.use(AuthMiddleware);

workspaceRouter
  .route('/')
  .get(asyncHandler(GetUserWorkspaces))
  .post(asyncHandler(CreateWorkspace));
workspaceRouter
  .route('/:workspaceId')
  .delete(asyncHandler(DeleteWorkspace))
  .post(asyncHandler(SwitchWorkspace));

export default workspaceRouter;
