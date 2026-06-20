import { Router } from 'express';
import {
  CreateComment,
  DeleteComment,
  UpdateComment,
} from '../controllers/comment.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const commentRouter = Router();
commentRouter.use(AuthMiddleware);

commentRouter.route('/:taskId/comments').post(asyncHandler(CreateComment));

commentRouter
  .route('/:taskId/comments/:commentId')
  .patch(asyncHandler(UpdateComment))
  .delete(asyncHandler(DeleteComment));

export default commentRouter;
