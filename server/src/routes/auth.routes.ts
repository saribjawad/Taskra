import { Router } from 'express';
import {
  LoginUser,
  RefreshAccessToken,
  SignUpUser,
} from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(LoginUser));
authRouter.post('/sign-up', asyncHandler(SignUpUser));
authRouter.post('/refresh-access-token', asyncHandler(RefreshAccessToken));

export default authRouter;
