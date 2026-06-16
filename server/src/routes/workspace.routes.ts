import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import {
  CreateWorkspace,
  DeleteWorkspace,
} from '../controllers/workspace.controller';

const workspaceRouter = Router();

workspaceRouter.use(AuthMiddleware);

workspaceRouter.route('/workspace').post(asyncHandler(CreateWorkspace));
workspaceRouter
  .route('/workspace/:workspaceId')
  .delete(asyncHandler(DeleteWorkspace));

export default workspaceRouter;
