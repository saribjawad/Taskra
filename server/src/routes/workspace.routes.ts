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
  GetWorkspaceUsers,
  InviteToWorkspace,
  RemoveMemberFromWorkspace,
  RevokeWorkspaceInvite,
  SwitchWorkspace,
  VerifyWorkspaceInvitation,
} from '../controllers/workspace.controller';

const workspaceRouter = Router();

// Public verification route
workspaceRouter.get(
  '/invite/:token/verify',
  asyncHandler(VerifyWorkspaceInvitation),
);

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

workspaceRouter
  .route('/:workspaceId/users')
  .get(asyncHandler(GetWorkspaceUsers));

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
