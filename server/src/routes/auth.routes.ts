import { Router } from 'express';
import { LoginUser, SignUpUser } from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(LoginUser));
authRouter.post('/sign-up', asyncHandler(SignUpUser));

export default authRouter;
