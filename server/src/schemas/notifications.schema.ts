import z from 'zod';

export const NotificationIdParamsSchema = z.object({
  notificationId: z.uuid('Invalid uuid'),
});
