import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateConversation } from '../controllers/conversations.controller';

const conversationRouter = Router();
conversationRouter.use(AuthMiddleware);

conversationRouter.route('/').post(asyncHandler(CreateConversation));

export default conversationRouter;
