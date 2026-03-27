import { Router } from 'express';
import { LoginUser, SignUpUser } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const userRouter = Router();

userRouter.post('/sign-in', asyncHandler(LoginUser));
userRouter.post('/sign-up', asyncHandler(SignUpUser));

export default userRouter;
