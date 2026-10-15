import { Request, Response, Router } from 'express';
import authRouter from './auth.routes';
import { ApiResponse } from '../utils/ApiResponse';
import taskRouter from './task.routes';
import userRouter from './user.routes';
import workspaceRouter from './workspace.routes';
import attachmentRouter from './attachment.routes';
import notificationRouter from './notification.routes';
import projectsRouter from './projects.routes';
import projectMilestonesRouter from './projectMilestones.routes';
import conversationRouter from './conversations.routes';
import messageRouter from './messages.routes';
import teamRouter from './teams.routes';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Server running!'));
});

// App routes
router.use(authRouter);
router.use('/users', userRouter);
router.use('/projects', projectsRouter);
router.use('/projects', projectMilestonesRouter);
router.use('/tasks', taskRouter);
router.use('/workspace', workspaceRouter);
router.use('/teams', teamRouter);
router.use('/attachment', attachmentRouter);
router.use('/notifications', notificationRouter);
router.use('/conversations', conversationRouter);
router.use('/messages', messageRouter);

export default router;
