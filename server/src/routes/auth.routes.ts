import { Router } from 'express';
import {
  ForgotPassword,
  LoginUser,
  RefreshAccessToken,
  ResendCode,
  ResetPassword,
  SignUpUser,
  VerifyEmail,
} from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(LoginUser));
authRouter.post('/sign-up', asyncHandler(SignUpUser));
authRouter.post('/refresh-access-token', asyncHandler(RefreshAccessToken));
authRouter.patch('/verify-email', asyncHandler(VerifyEmail));
authRouter.get('/resend-code', asyncHandler(ResendCode));
authRouter.get('/forgot-password', asyncHandler(ForgotPassword));
authRouter.patch('/reset-password', asyncHandler(ResetPassword));

export default authRouter;
