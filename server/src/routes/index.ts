import { Request, Response, Router } from 'express';
import authRouter from './auth.routes';
import { ApiResponse } from '../utils/ApiResponse';
import taskRouter from './task.routes';
import commentRouter from './comment.route';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Server running!'));
});

// App routes
router.use(authRouter);
router.use(taskRouter);
router.use(commentRouter);

export default router;
