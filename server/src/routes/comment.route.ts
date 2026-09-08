import { Router } from 'express';
import {
  CreateComment,
  DeleteComment,
  UpdateComment,
} from '../controllers/comment.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const commentRouter = Router();
commentRouter.use(AuthMiddleware);

commentRouter
  .route('/:taskId/comments')
  .post(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(CreateComment),
  );

commentRouter
  .route('/:taskId/comments/:commentId')
  .patch(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(UpdateComment),
  )
  .delete(
    RequiredRoles(['owner', 'admin', 'member']),
    asyncHandler(DeleteComment),
  );

export default commentRouter;
