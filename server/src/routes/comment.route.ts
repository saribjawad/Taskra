import { Router } from 'express';
import { CreateComment } from '../controllers/comment.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const commentRouter = Router();

commentRouter
  .route('/tasks/:taskId/comments')
  .post(AuthMiddleware, asyncHandler(CreateComment));

export default commentRouter;
