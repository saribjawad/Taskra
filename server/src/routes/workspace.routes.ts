import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import {
  AcceptWorkspaceInvite,
  CreateWorkspace,
  DeclineWorkspaceInvite,
  DeleteWorkspace,
  GetPendingWorkspaceInvites,
  GetUserWorkspaces,
  GetWorkspaceInvites,
  GetWorkspaceDashboard,
  GetWorkspaceUsers,
  InviteToWorkspace,
  RemoveMemberFromWorkspace,
  ResendWorkspaceInvite,
  RevokeWorkspaceInvite,
  SwitchWorkspace,
  VerifyWorkspaceInvitation,
} from '../controllers/workspace.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';
import { GetProjects } from '../controllers/projects.controller';

const workspaceRouter = Router();

// Public verification route
workspaceRouter.get(
  '/invite/:token/verify',
  asyncHandler(VerifyWorkspaceInvitation),
);

workspaceRouter.use(AuthMiddleware);

workspaceRouter
  .route('/')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetUserWorkspaces),
  )
  .post(asyncHandler(CreateWorkspace));

workspaceRouter
  .route('/:workspaceId')
  .delete(RequiredRoles(['owner']), asyncHandler(DeleteWorkspace))
  .post(asyncHandler(SwitchWorkspace));

workspaceRouter
  .route('/:workspaceId/member/:memberId')
  .delete(RequiredRoles(['owner']), asyncHandler(RemoveMemberFromWorkspace));

workspaceRouter
  .route('/:workspaceId/invite')
  .get(asyncHandler(GetWorkspaceInvites))
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(InviteToWorkspace));

workspaceRouter
  .route('/:workspaceId/users')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetWorkspaceUsers),
  );
workspaceRouter
  .route('/:workspaceId/dashboard')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetWorkspaceDashboard),
  );
workspaceRouter.get(
  '/:workspaceId/invite/pending',
  RequiredRoles(['owner', 'admin']),
  asyncHandler(GetPendingWorkspaceInvites),
);
workspaceRouter.post(
  '/invite/:token/accept',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(AcceptWorkspaceInvite),
);
workspaceRouter.post(
  '/invite/:token/decline',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(DeclineWorkspaceInvite),
);
workspaceRouter.post(
  '/invite/:invitationId/revoke',
  RequiredRoles(['owner', 'admin']),
  asyncHandler(RevokeWorkspaceInvite),
);
workspaceRouter.post(
  '/invite/:invitationId/resend',
  RequiredRoles(['owner', 'admin']),
  asyncHandler(ResendWorkspaceInvite),
);
workspaceRouter
  .route('/:workspaceId/projects')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetProjects),
  );

export default workspaceRouter;
