import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  AddTeamMember,
  CreateTeam,
  DeleteTeam,
  GetTeamMembers,
  GetTeamProjects,
  GetTeamTasks,
  GetWorkspaceTeams,
  RemoveTeamMember,
} from '../controllers/teams.controller';
import {
  CreateTeamDocument,
  CreateTeamLink,
  DeleteTeamDocument,
  DeleteTeamLink,
  GetTeamDocument,
  GetTeamDocuments,
  GetTeamLink,
  GetTeamLinks,
  UpdateTeamDocument,
  UpdateTeamLink,
} from '../controllers/teamResources.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const teamRouter = Router();
teamRouter.use(AuthMiddleware);
teamRouter.use(RequrieActiveWorkspace);

teamRouter
  .route('/')
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(CreateTeam))
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetWorkspaceTeams),
  );
teamRouter
  .route('/:teamId')
  .delete(RequiredRoles(['owner', 'admin']), asyncHandler(DeleteTeam));
teamRouter
  .route('/:teamId/tasks')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamTasks),
  );
teamRouter
  .route('/:teamId/projects')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamProjects),
  );

teamRouter
  .route('/:teamId/member')
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(AddTeamMember))
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamMembers),
  );
teamRouter
  .route('/:teamId/member/:memberId')
  .delete(RequiredRoles(['owner', 'admin']), asyncHandler(RemoveTeamMember));

teamRouter
  .route('/:teamId/document')
  .post(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateTeamDocument),
  )
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamDocuments),
  );
teamRouter
  .route('/:teamId/link')
  .post(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateTeamLink),
  )
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamLinks),
  );

teamRouter
  .route('/:teamId/document/:documentId')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamDocument),
  )
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateTeamDocument),
  )
  .delete(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(DeleteTeamDocument),
  );
teamRouter
  .route('/:teamId/link/:linkId')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetTeamLink),
  )
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateTeamLink),
  )
  .delete(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(DeleteTeamLink),
  );

export default teamRouter;
