import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { GetUserNotifications } from '../controllers/notifications.controller';

const notificationRouter = Router();

notificationRouter.use(AuthMiddleware);

notificationRouter.get('/', asyncHandler(GetUserNotifications));
notificationRouter.patch('/:notificationId/seen', asyncHandler);

export default notificationRouter;
