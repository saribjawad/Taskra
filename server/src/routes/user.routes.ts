import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { getMe } from '../controllers/user.controller';

const userRouter = Router();
userRouter.use(AuthMiddleware);

userRouter.route('/users/me').get(asyncHandler(getMe));

export default userRouter;
