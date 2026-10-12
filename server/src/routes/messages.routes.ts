import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { SendMessage } from '../controllers/messages.controller';

const messageRouter = Router();
messageRouter.use(AuthMiddleware);

messageRouter.route('/:conversationId/send').post(asyncHandler(SendMessage));

export default messageRouter;
