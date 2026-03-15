import { Router } from 'express';
import { SignUpUser } from '../controllers/user.controller';
import { asyncHandler } from '../utils/asyncHandler';

const userRouter = Router();

userRouter.post('/sign-up', asyncHandler(SignUpUser));

export default userRouter;
