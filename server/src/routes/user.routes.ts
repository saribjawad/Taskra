import { Request, Response, Router } from 'express';

const userRouter = Router();

userRouter.post('/login', (_req: Request, res: Response) => {
  res.send({
    message: 'test',
  });
});

export default userRouter;
