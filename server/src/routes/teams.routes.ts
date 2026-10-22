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

const teamRouter = Router();
teamRouter.use(AuthMiddleware);
teamRouter.use(RequrieActiveWorkspace);

teamRouter
  .route('/')
  .post(asyncHandler(CreateTeam))
  .get(asyncHandler(GetWorkspaceTeams));
teamRouter.route('/:teamId').delete(asyncHandler(DeleteTeam));
teamRouter.route('/:teamId/tasks').get(asyncHandler(GetTeamTasks));
teamRouter.route('/:teamId/projects').get(asyncHandler(GetTeamProjects));

teamRouter
  .route('/:teamId/member')
  .post(asyncHandler(AddTeamMember))
  .get(asyncHandler(GetTeamMembers));
teamRouter
  .route('/:teamId/member/:memberId')
  .delete(asyncHandler(RemoveTeamMember));

teamRouter
  .route('/:teamId/document')
  .post(asyncHandler(CreateTeamDocument))
  .get(asyncHandler(GetTeamDocuments));
teamRouter
  .route('/:teamId/link')
  .post(asyncHandler(CreateTeamLink))
  .get(asyncHandler(GetTeamLinks));

teamRouter
  .route('/:teamId/document/:documentId')
  .get(asyncHandler(GetTeamDocument))
  .patch(asyncHandler(UpdateTeamDocument))
  .delete(asyncHandler(DeleteTeamDocument));
teamRouter
  .route('/:teamId/link/:linkId')
  .get(asyncHandler(GetTeamLink))
  .patch(asyncHandler(UpdateTeamLink))
  .delete(asyncHandler(DeleteTeamLink));

export default teamRouter;
