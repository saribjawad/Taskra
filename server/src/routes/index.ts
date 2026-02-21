import { Request, Response, Router } from 'express';
import userRouter from './user.routes';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.send({
    message: 'Server running!',
  });
});

// User routes
router.use(userRouter);

export default router;
