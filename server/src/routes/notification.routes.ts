import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  DeleteAllNotifications,
  DeleteNotification,
  MarkAllNotificationsAsSeen,
  GetUserNotifications,
  MarkNotificationAsSeen,
} from '../controllers/notifications.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';

const notificationRouter = Router();

notificationRouter.use(AuthMiddleware);
notificationRouter.use(RequrieActiveWorkspace);

notificationRouter.get(
  '/',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(GetUserNotifications),
);
notificationRouter.patch(
  '/seen',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(MarkAllNotificationsAsSeen),
);
notificationRouter.delete(
  '/all',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(DeleteAllNotifications),
);
notificationRouter.patch(
  '/:notificationId/seen',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(MarkNotificationAsSeen),
);
notificationRouter.delete(
  '/:notificationId',
  RequiredRoles(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(DeleteNotification),
);

export default notificationRouter;
