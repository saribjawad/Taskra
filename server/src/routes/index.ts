import { Request, Response, Router } from 'express';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.send({
    message: 'Server running!',
  });
});

export default router;
