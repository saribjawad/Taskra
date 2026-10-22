import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { SendMessage } from '../controllers/messages.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const messageRouter = Router();
messageRouter.use(AuthMiddleware);

messageRouter
  .route('/:conversationId/send')
  .post(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(SendMessage),
  );

export default messageRouter;
