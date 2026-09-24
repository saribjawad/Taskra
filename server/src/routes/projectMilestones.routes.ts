import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateMilestone,
  DeleteMilestones,
  UpdateMilestones,
} from '../controllers/projectMilestones.controller';

const projectMilestonesRouter = Router();
projectMilestonesRouter.use(AuthMiddleware);

projectMilestonesRouter
  .route('/:projectId/milestone')
  .post(asyncHandler(CreateMilestone));

projectMilestonesRouter
  .route('/:projectId/milestone/:milestoneId')
  .patch(asyncHandler(UpdateMilestones))
  .delete(asyncHandler(DeleteMilestones));

export default projectMilestonesRouter;
