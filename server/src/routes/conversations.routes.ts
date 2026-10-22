import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateConversation,
  GetConversationMessages,
  GetUsersConversations,
} from '../controllers/conversations.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const conversationRouter = Router();
conversationRouter.use(AuthMiddleware);

conversationRouter
  .route('/')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetUsersConversations),
  )
  .post(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(CreateConversation),
  );

conversationRouter
  .route('/:conversationId/messages')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetConversationMessages),
  );

export default conversationRouter;
