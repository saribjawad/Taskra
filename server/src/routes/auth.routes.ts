import { Router } from 'express';
import {
  ForgotPassword,
  LoginUser,
  RefreshAccessToken,
  ResendCode,
  ResetPassword,
  SignOutUser,
  SignUpUser,
  VerifyEmail,
} from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { RateLimitMiddleware } from '../middlewares/rateLimit.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(LoginUser));
authRouter.post('/sign-up', asyncHandler(SignUpUser));
authRouter.post('/sign-out', AuthMiddleware, asyncHandler(SignOutUser));
authRouter.post('/refresh-access-token', asyncHandler(RefreshAccessToken));
authRouter.patch('/verify-email', asyncHandler(VerifyEmail));
authRouter.post('/resend-code', RateLimitMiddleware, asyncHandler(ResendCode));
authRouter.post(
  '/forgot-password',
  RateLimitMiddleware,
  asyncHandler(ForgotPassword),
);
authRouter.patch(
  '/reset-password',
  RateLimitMiddleware,
  asyncHandler(ResetPassword),
);

export default authRouter;
