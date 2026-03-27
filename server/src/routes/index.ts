import { Request, Response, Router } from 'express';
import authRouter from './auth.routes';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.send({
    message: 'Server running!',
  });
});

// User routes
router.use(authRouter);

export default router;
