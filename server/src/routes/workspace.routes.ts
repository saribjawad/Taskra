import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import {
  AcceptWorkspaceInvite,
  CreateWorkspace,
  DeclineWorkspaceInvite,
  DeleteWorkspace,
  GetUserWorkspaces,
  GetWorkspaceInvites,
  InviteToWorkspace,
  RemoveMemberFromWorkspace,
  RevokeWorkspaceInvite,
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

workspaceRouter
  .route('/:workspaceId/member/:memberId')
  .delete(asyncHandler(RemoveMemberFromWorkspace));

workspaceRouter
  .route('/:workspaceId/invite')
  .get(asyncHandler(GetWorkspaceInvites))
  .post(asyncHandler(InviteToWorkspace));

workspaceRouter.post(
  '/invite/:token/accept',
  asyncHandler(AcceptWorkspaceInvite),
);
workspaceRouter.post(
  '/invite/:token/decline',
  asyncHandler(DeclineWorkspaceInvite),
);
workspaceRouter.post(
  '/invite/:token/revoke',
  asyncHandler(RevokeWorkspaceInvite),
);

export default workspaceRouter;
