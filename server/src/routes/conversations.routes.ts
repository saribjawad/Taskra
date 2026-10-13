import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateConversation,
  GetConversationMessages,
  GetUsersConversations,
} from '../controllers/conversations.controller';

const conversationRouter = Router();
conversationRouter.use(AuthMiddleware);

conversationRouter
  .route('/')
  .get(asyncHandler(GetUsersConversations))
  .post(asyncHandler(CreateConversation));

conversationRouter
  .route('/:conversationId/messages')
  .get(asyncHandler(GetConversationMessages));

export default conversationRouter;
