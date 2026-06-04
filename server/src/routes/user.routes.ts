import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { GetCurrentUser, UpdateUser } from '../controllers/user.controller';

const userRouter = Router();
userRouter.use(AuthMiddleware);

userRouter
  .route('/users/me')
  .get(asyncHandler(GetCurrentUser))
  .patch(asyncHandler(UpdateUser));

export default userRouter;
