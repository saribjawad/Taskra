import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import {
  AcceptWorkspaceInvite,
  CreateWorkspace,
  DeleteWorkspace,
  GetUserWorkspaces,
  InviteToWorkspace,
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
workspaceRouter.post('/:workspaceId/invite', asyncHandler(InviteToWorkspace));
workspaceRouter.post(
  '/:workspaceId/invite/:token/accept',
  asyncHandler(AcceptWorkspaceInvite),
);

export default workspaceRouter;
