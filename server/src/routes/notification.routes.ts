import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  GetUserNotifications,
  MarkNotificationAsSeen,
} from '../controllers/notifications.controller';

const notificationRouter = Router();

notificationRouter.use(AuthMiddleware);

notificationRouter.get('/', asyncHandler(GetUserNotifications));
notificationRouter.patch(
  '/:notificationId/seen',
  asyncHandler(MarkNotificationAsSeen),
);

export default notificationRouter;
