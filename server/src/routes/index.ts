import { Request, Response, Router } from 'express';
import authRouter from './auth.routes';
import { ApiResponse } from '../utils/ApiResponse';
import taskRouter from './task.routes';
import commentRouter from './comment.route';
import userRouter from './user.routes';
import workspaceRouter from './workspace.routes';
import attachmentRouter from './attachment.routes';
import notificationRouter from './notification.routes';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Server running!'));
});

// App routes
router.use(authRouter);
router.use('/users', userRouter);
router.use('/tasks', taskRouter);
router.use('/tasks', commentRouter);
router.use('/workspace', workspaceRouter);
router.use('/attachment', attachmentRouter);
router.use('/notifications', notificationRouter);

export default router;
