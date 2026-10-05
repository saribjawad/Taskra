import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  DeleteNotification,
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
notificationRouter.delete('/:notificationId', asyncHandler(DeleteNotification));

export default notificationRouter;
