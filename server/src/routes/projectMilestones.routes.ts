import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateMilestone,
  DeleteMilestones,
  UpdateMilestones,
} from '../controllers/projectMilestones.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const projectMilestonesRouter = Router();
projectMilestonesRouter.use(AuthMiddleware);

projectMilestonesRouter
  .route('/:projectId/milestone')
  .post(RequiredRoles(['owner', 'admin']), asyncHandler(CreateMilestone));

projectMilestonesRouter
  .route('/:projectId/milestone/:milestoneId')
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateMilestones),
  )
  .delete(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(DeleteMilestones),
  );

export default projectMilestonesRouter;
